#!/usr/bin/env python3
"""Validate private article packages; create-only Payload drafts, never publish."""

import argparse
from contextlib import contextmanager
from datetime import date
import hashlib
import json
import os
from pathlib import Path
import re
import struct
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, HTTPRedirectHandler, build_opener
import uuid

ORIGIN = "https://datahub.kieks.me"
SLUG = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")


class DraftError(ValueError):
    """Safe operational message, never an API response or article content."""


def require(condition, message):
    if not condition:
        raise DraftError(message)


def text(value):
    return isinstance(value, str) and bool(value.strip())


def safe_url(value, relative=False):
    require(text(value) and not re.search(r"[\s\x00-\x1f\x7f]", value), "Ungültige URL")
    if relative and value.startswith("/") and not value.startswith("//"):
        require(not value.startswith(("/api/", "/admin", "/preview/")), "Privater Link im Artikel")
        return
    url = urlsplit(value)
    require(url.scheme == "https" and url.hostname and not url.username and not url.password,
            "Nur HTTPS-URLs ohne Zugangsdaten")
    require(url.hostname != "datahub.kieks.me" and not url.query and not url.fragment,
            "Keine privaten CMS-URLs oder URL-Parameter im Paket; bereinigte Quellen verwenden")


def lexical(value):
    require(isinstance(value, dict) and isinstance(value.get("root"), dict), "Lexical-Root fehlt")
    budget = [5000]
    def visit(node, depth=0):
        budget[0] -= 1
        require(isinstance(node, dict) and depth <= 24 and budget[0] >= 0, "Lexical-Struktur zu groß")
        kind = node.get("type")
        require(kind in {"root", "paragraph", "heading", "text", "linebreak", "list", "listitem", "quote", "link"},
                "Nicht unterstützter Lexical-Knoten")
        require(node.get("version") == 1, "Lexical-Version muss 1 sein")
        if depth == 0:
            require(kind == "root" and node.get("children"), "Leerer Lexical-Inhalt")
        else:
            require(kind != "root", "Verschachtelter Lexical-Root")
        if kind == "text":
            require(isinstance(node.get("text"), str), "Lexical-Text fehlt")
        if kind == "heading":
            require(node.get("tag") in {"h2", "h3", "h4"}, "Nur h2–h4 im Artikel")
        if kind == "link":
            fields = node.get("fields", {})
            require(fields.get("linkType") == "custom", "Nur explizite Artikel-Links")
            safe_url(fields.get("url"), relative=True)
        for child in node.get("children", []):
            visit(child, depth + 1)
    visit(value["root"])


def image_file(root, image):
    require(set(image) == {"file", "alt", "prompt"} and all(text(v) for v in image.values()),
            "Bild benötigt file, alt und tatsächlichen Generierungsprompt")
    path = (root / image["file"]).resolve()
    require(not Path(image["file"]).is_absolute() and path.is_relative_to(root.resolve()),
            "Bild muss innerhalb des privaten Pakets liegen")
    data = path.read_bytes()
    require(24 <= len(data) <= 20 * 1024 * 1024 and data[:8] == b"\x89PNG\r\n\x1a\n"
            and data[12:16] == b"IHDR", "Bild muss PNG bis 20 MiB sein")
    width, height = struct.unpack(">II", data[16:24])
    require(width >= 1200 and height >= 630, "OG-/Hero-Bild mindestens 1200×630")
    return path, data


def validate(package, root):
    require(set(package) == {"brief", "sources", "variants"}, "Unbekannte Paketfelder")
    brief = package["brief"]
    require(set(brief) == {"audience", "topic", "goal", "languages", "authorId", "cta"}, "Interviewfelder fehlen")
    require(all(text(brief.get(k)) for k in ["audience", "topic", "goal"]), "Zielgruppe/Thema/Ziel fehlen")
    require(isinstance(brief["authorId"], (str, int)) and not isinstance(brief["authorId"], bool)
            and str(brief["authorId"]), "Bestehende Autoren-ID erforderlich")
    require(set(brief["cta"]) == {"label", "href"} and text(brief["cta"]["label"]), "CTA fehlt")
    safe_url(brief["cta"]["href"], relative=True)
    languages = brief["languages"]
    require(isinstance(languages, list) and languages and all(text(language) for language in languages)
            and len(set(languages)) == len(languages), "Artikelsprachen fehlen oder doppelt")
    require(isinstance(package["sources"], list) and package["sources"], "Geprüfte Quellen erforderlich")
    for source in package["sources"]:
        require(set(source) == {"url", "title", "accessedAt", "supports"} and text(source["title"]), "Quellenfelder fehlen")
        safe_url(source["url"])
        accessed = date.fromisoformat(source["accessedAt"])
        require(accessed <= date.today() and source["supports"] and all(text(s) for s in source["supports"]),
                "Abrufdatum/Quellenbeleg ungültig")
    variants = package["variants"]
    require(isinstance(variants, list) and len(variants) == len(languages), "Sprachvarianten unvollständig")
    require(sorted(v["language"] for v in variants) == sorted(languages), "Sprachvarianten widersprechen Interview")
    for variant in variants:
        required = {"language", "slug", "title", "excerpt", "contentRichText", "image", "seo"}
        require(required <= set(variant) <= required | {"category", "tags"}, "Unbekannte/fehlende Artikelfelder")
        require(all(text(variant[k]) for k in ["slug", "title", "excerpt"]), "Artikeltext fehlt")
        require(len(variant["slug"]) <= 120 and SLUG.fullmatch(variant["slug"]), "Ungültiger Slug")
        require(all(text(t) for t in variant.get("tags", [])), "Ungültige Tags")
        lexical(variant["contentRichText"])
        image_file(root, variant["image"])
        seo = variant["seo"]
        require(set(seo) == {"title", "description", "openGraph"}
                and text(seo["title"]) and text(seo["description"]), "SEO-Texte fehlen")
        og = seo["openGraph"]
        require(set(og) == {"title", "description", "imageAlt"} and all(text(v) for v in og.values()), "OG-Texte fehlen")
        require(og["imageAlt"] == variant["image"]["alt"], "Hero-/OG-Alttexte widersprechen sich")


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *_args, **_kwargs):
        return None


class Client:
    def __init__(self, key):
        require(text(key), "DATAHUB_EDITOR_API_KEY fehlt; kein CMS-Import ausgeführt")
        self.key = key
        self.opener = build_opener(NoRedirect())

    def request(self, method, path, data=None, mime="application/json"):
        require(path.startswith("/api/") and not path.startswith("//"), "Ungültiger API-Pfad")
        body = json.dumps(data).encode() if data is not None and mime == "application/json" else data
        request = Request(ORIGIN + path, data=body, method=method, headers={
            "Authorization": "users API-Key " + self.key, "Content-Type": mime})
        try:
            with self.opener.open(request, timeout=45) as response:
                return json.load(response)
        except HTTPError as error:
            raise DraftError(f"CMS {method} fehlgeschlagen (HTTP {error.code}); keine automatischen Write-Retries") from None
        except (URLError, TimeoutError):
            raise DraftError("CMS-Netzwerkfehler: Bestand/Receipt vor Wiederholung lesend prüfen") from None

    def upload(self, path, alt):
        boundary = "draftblog" + uuid.uuid4().hex
        metadata = json.dumps({"alt": alt, "websitePublished": False}, ensure_ascii=False)
        # Payload's multipart REST contract: JSON is carried in _payload.
        data = (f'--{boundary}\r\nContent-Disposition: form-data; name="_payload"\r\n\r\n{metadata}\r\n'
                f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="hero.png"\r\n'
                'Content-Type: image/png\r\n\r\n').encode() + path.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
        return self.request("POST", "/api/media", data, "multipart/form-data; boundary=" + boundary)["doc"]


def document(variant, author, media):
    og = variant["seo"]["openGraph"]
    return {
        "title": variant["title"], "slug": variant["slug"], "excerpt": variant["excerpt"],
        "author": author, "category": variant.get("category", ""),
        "tags": [{"tag": tag} for tag in variant.get("tags", [])],
        "contentRichText": variant["contentRichText"], "heroImage": media, "_status": "draft",
        "seo": {"title": variant["seo"]["title"], "description": variant["seo"]["description"],
                "openGraph": {**og, "type": "article", "image": media},
                "twitter": {"card": "summary_large_image", "title": og["title"],
                            "description": og["description"], "image": media}},
    }


def includes(actual, expected):
    if isinstance(expected, dict):
        return isinstance(actual, dict) and all(k in actual and includes(actual[k], v) for k, v in expected.items())
    if isinstance(expected, list):
        return isinstance(actual, list) and len(actual) == len(expected) and all(includes(a, b) for a, b in zip(actual, expected))
    return actual == expected


def save_receipt(path, receipt):
    temporary = path.with_suffix(".tmp")
    descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w") as output:
        json.dump(receipt, output)
        output.flush()
        os.fsync(output.fileno())
    os.replace(temporary, path)


@contextmanager
def lock(path):
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        yield
    finally:
        os.close(descriptor)
        path.unlink()


def create(package, root, receipt_path, client):
    validate(package, root)
    require(package["brief"]["languages"] == ["de"],
            "CMS-Lokalisierung noch ungeprüft: Sprachvarianten privat vorbereitet, kein Import")
    fingerprint = hashlib.sha256(json.dumps(package, sort_keys=True).encode())
    for variant in package["variants"]:
        fingerprint.update(image_file(root, variant["image"])[1])
    fingerprint = fingerprint.hexdigest()
    receipt = json.loads(receipt_path.read_text()) if receipt_path.exists() else {"fingerprint": fingerprint}
    require(receipt.get("fingerprint") == fingerprint, "Paket wurde seit Import geändert; Receipt nicht überschreiben")
    user = client.request("GET", "/api/users/me").get("user", {})
    require(user and user.get("active") and user.get("role") in {"staff", "admin"},
            "Privater Mediaupload benötigt geeigneten staff/admin-Zugang; MCP-Editor hat kein Medienrecht")
    author_id = package["brief"]["authorId"]
    require(re.fullmatch(r"[a-zA-Z0-9_-]+", str(author_id)), "Ungültige Autoren-ID")
    author = client.request("GET", f"/api/authors/{author_id}?depth=0&draft=true")
    require(str(author.get("id")) == str(author_id) and text(author.get("name")) and text(author.get("slug")),
            "Vorhandenes Autorenprofil nicht lesbar")
    author_id = author["id"]
    variant = package["variants"][0]
    query = urlencode({"where[slug][equals]": variant["slug"], "depth": 0, "draft": "true", "limit": 2})
    existing = client.request("GET", "/api/posts?" + query)
    require(existing.get("totalDocs") == len(existing.get("docs", [])) <= 1, "Slug mehrdeutig")
    if existing["docs"]:
        current = existing["docs"][0]
        require(receipt.get("postId") == current.get("id") and receipt.get("mediaId")
                and includes(current, document(variant, author_id, receipt["mediaId"])),
                "Bestehender/bearbeiteter/veröffentlichter Artikel bleibt unverändert")
        media = client.request("GET", f'/api/media/{receipt["mediaId"]}?depth=0')
        require(media.get("websitePublished") is False and media.get("alt") == variant["image"]["alt"],
                "Draft-Medium wurde geändert oder freigegeben")
        return current["id"]
    require(not receipt.get("postId"), "Bereits übernommener Post fehlt; keine automatische Neuanlage")
    if receipt.get("mediaId"):
        media = client.request("GET", f'/api/media/{receipt["mediaId"]}?depth=0')
    else:
        media = client.upload(image_file(root, variant["image"])[0], variant["image"]["alt"])
        require(media.get("id") is not None and media.get("websitePublished") is False
                and media.get("alt") == variant["image"]["alt"], "Medienantwort widerspricht privatem Upload")
        receipt["mediaId"] = media["id"]
        save_receipt(receipt_path, receipt)
    require(media.get("websitePublished") is False and media.get("alt") == variant["image"]["alt"],
            "Vorhandenes Medium wurde freigegeben/geändert; kein Write")
    body = document(variant, author_id, media["id"])
    post = client.request("POST", "/api/posts?draft=true&autosave=false&depth=0", body)["doc"]
    require(post.get("id") is not None and includes(post, body), "CMS-Antwort widerspricht Draft; Bestand prüfen")
    receipt["postId"] = post["id"]
    save_receipt(receipt_path, receipt)
    verified = client.request("GET", f'/api/posts/{post["id"]}?draft=true&depth=0')
    require(includes(verified, body), "Draft-Nachprüfung fehlgeschlagen")
    return post["id"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["validate", "create"])
    parser.add_argument("manifest", type=Path)
    args = parser.parse_args()
    os.umask(0o077)
    try:
        manifest = args.manifest.resolve()
        package = json.loads(manifest.read_text())
        validate(package, manifest.parent)
        if args.command == "validate":
            print("Paket strukturell geprüft; kein CMS-Zugriff, keine Fakten-/Bildprüfung behauptet.")
            return 0
        require(not any((p / ".git").is_file() or (p / ".git/HEAD").is_file()
                        for p in [manifest.parent, *manifest.parent.parents]), "CMS-Paket muss außerhalb Git liegen")
        require(manifest.parent.stat().st_mode & 0o077 == 0, "Paketverzeichnis muss privat (0700) sein")
        receipt = manifest.with_suffix(".receipt.json")
        with lock(manifest.with_suffix(".lock")):
            identifier = create(package, manifest.parent, receipt, Client(os.environ.get("DATAHUB_EDITOR_API_KEY")))
        print(f"CMS-Entwurf geprüft: {ORIGIN}/preview/posts/{identifier} (private Browser-Session erforderlich)")
        return 0
    except DraftError as error:
        print(str(error), file=sys.stderr)
        return 1
    except (ValueError, OSError, KeyError, TypeError, struct.error):
        # API bodies, URLs, article contents and secrets never go into logs.
        print("Entwurf nicht abgeschlossen. Paket/Schema, Sprache, Zugang/Rechte, Slug und private Receipt prüfen; keine automatischen Write-Retries.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
