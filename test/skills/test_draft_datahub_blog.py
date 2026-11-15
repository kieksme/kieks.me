"""Offline-only CMS fixtures. No credentials, images or live posts are created."""
from copy import deepcopy
import importlib.util
import io
import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
import zlib


SCRIPT = Path(__file__).resolve().parents[2] / ".agents/skills/draft-datahub-blog/scripts/draft_blog.py"
SPEC = importlib.util.spec_from_file_location("draft_blog", SCRIPT)
blog = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(blog)


def png():
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", 1200, 630, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress((b"\0" + b"\0" * 3600) * 630)) + chunk(b"IEND", b""))


def package():
    return {"brief": {"audience": "Offline test audience", "topic": "Fixture", "goal": "Test",
                      "languages": ["de"], "authorId": 5, "cta": {"label": "Kontakt", "href": "/kontakt"}},
            "sources": [{"url": "https://example.org/source", "title": "Test fixture only",
                         "accessedAt": "2026-01-01", "supports": ["Fixture statement"]}],
            "variants": [{"language": "de", "slug": "offline-fixture", "title": "Fixture",
                          "excerpt": "Offline only", "contentRichText": {"root": {
                              "type": "root", "version": 1, "children": [{"type": "paragraph", "version": 1,
                                  "children": [{"type": "text", "version": 1, "text": "Fixture content"}]}]}},
                          "image": {"file": "hero.png", "alt": "Testbild", "prompt": "Fixture only"},
                          "seo": {"title": "Fixture", "description": "Test",
                                  "openGraph": {"title": "Fixture", "description": "Test", "imageAlt": "Testbild"}}}]}


class FakeCMS:
    def __init__(self):
        self.calls = []
        self.posts = []
        self.media = None
        self.role = "staff"
        self.fail_post = False

    def request(self, method, path, data=None, mime=None):
        self.calls.append((method, path, deepcopy(data)))
        if path == "/api/users/me":
            return {"user": {"active": True, "role": self.role}}
        if path.startswith("/api/authors/"):
            return {"id": 5, "name": "Existing fixture profile", "slug": "fixture-profile"}
        if method == "GET" and path.startswith("/api/posts?"):
            return {"totalDocs": len(self.posts), "docs": deepcopy(self.posts)}
        if method == "GET" and path.startswith("/api/posts/"):
            return deepcopy(self.posts[0])
        if method == "GET" and path.startswith("/api/media/"):
            return deepcopy(self.media)
        if method == "POST" and path.startswith("/api/posts?"):
            if self.fail_post:
                raise blog.DraftError("Simulated failure")
            self.posts.append({**deepcopy(data), "id": 20})
            return {"doc": deepcopy(self.posts[0])}
        raise AssertionError("Unexpected request")

    def upload(self, path, alt):
        self.calls.append(("POST", "/api/media", {"websitePublished": False, "alt": alt}))
        self.media = {"id": 10, "websitePublished": False, "alt": alt}
        return deepcopy(self.media)


class BlogDraftTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        (self.root / "hero.png").write_bytes(png())
        self.receipt = self.root / "article.receipt.json"
        self.package = package()
        self.cms = FakeCMS()

    def create(self):
        return blog.create(self.package, self.root, self.receipt, self.cms)

    def test_creates_private_media_and_consistent_draft_then_idempotent_read(self):
        self.assertEqual(self.create(), 20)
        post = self.cms.posts[0]
        self.assertEqual(post["_status"], "draft")
        self.assertEqual(post["author"], 5)
        self.assertEqual(post["heroImage"], post["seo"]["openGraph"]["image"])
        self.assertEqual(post["heroImage"], post["seo"]["twitter"]["image"])
        self.assertFalse(self.cms.media["websitePublished"])
        self.assertEqual(self.receipt.stat().st_mode & 0o777, 0o600)
        writes = sum(method == "POST" for method, _, _ in self.cms.calls)
        self.assertEqual(self.create(), 20)
        self.assertEqual(sum(method == "POST" for method, _, _ in self.cms.calls), writes)

    def test_localization_blocks_before_any_network_or_partial_import(self):
        self.package["brief"]["languages"].append("en")
        english = deepcopy(self.package["variants"][0])
        english["language"] = "en"
        self.package["variants"].append(english)
        with self.assertRaisesRegex(blog.DraftError, "Lokalisierung"):
            self.create()
        self.assertEqual(self.cms.calls, [])

    def test_editor_service_cannot_upload_or_escalate_permissions(self):
        self.cms.role = "service"
        with self.assertRaisesRegex(blog.DraftError, "Medienrecht"):
            self.create()
        self.assertEqual([call[0] for call in self.cms.calls], ["GET"])

    def test_published_or_foreign_slug_never_changed(self):
        for status in ["published", "draft"]:
            self.cms.posts = [{"id": 90, "_status": status}]
            with self.assertRaisesRegex(blog.DraftError, "unverändert"):
                self.create()
        self.assertFalse(any(method != "GET" for method, _, _ in self.cms.calls))

    def test_readback_changes_and_published_own_post_are_not_overwritten(self):
        self.create()
        for field, value in [("_status", "published"), ("title", "Human edit")]:
            original = self.cms.posts[0][field]
            self.cms.posts[0][field] = value
            with self.assertRaisesRegex(blog.DraftError, "unverändert"):
                self.create()
            self.cms.posts[0][field] = original
        self.cms.media["websitePublished"] = True
        with self.assertRaisesRegex(blog.DraftError, "freigegeben"):
            self.create()

    def test_partial_failure_can_reuse_private_receipted_media(self):
        self.cms.fail_post = True
        with self.assertRaises(blog.DraftError):
            self.create()
        self.assertEqual(json.loads(self.receipt.read_text())["mediaId"], 10)
        self.cms.fail_post = False
        self.create()
        self.assertEqual(sum(path == "/api/media" for _, path, _ in self.cms.calls), 1)

    def test_changed_package_or_image_does_not_reuse_receipt(self):
        self.create()
        self.package["variants"][0]["title"] = "Changed"
        with self.assertRaisesRegex(blog.DraftError, "Paket wurde"):
            self.create()

    def test_missing_interview_mismatched_alt_and_unsafe_fields_fail(self):
        for mutate in [lambda p: p["brief"].pop("audience"),
                       lambda p: p["variants"][0]["seo"]["openGraph"].update(imageAlt="Different"),
                       lambda p: p["variants"][0].update(_status="published"),
                       lambda p: p["variants"][0]["image"].update(file="../outside.png")]:
            data = deepcopy(self.package)
            mutate(data)
            with self.assertRaises(blog.DraftError):
                blog.validate(data, self.root)

    def test_redirect_blocked_and_upload_metadata_stays_private(self):
        self.assertIsNone(blog.NoRedirect().redirect_request(None, None, None, None, None, None))
        client = blog.Client("offline-test-key")
        with patch.object(client, "request", return_value={"doc": {"id": 10}}) as request:
            client.upload(self.root / "hero.png", "Testbild")
        args = request.call_args.args
        self.assertEqual(args[:2], ("POST", "/api/media"))
        self.assertIn(b'"websitePublished": false', args[2])
        self.assertIn(b'name="_payload"', args[2])
        self.assertNotIn(b"offline-test-key", args[2])

    def test_cli_validate_and_missing_key_do_not_claim_upload(self):
        manifest = self.root / "article.json"
        manifest.write_text(json.dumps(self.package))
        with patch("sys.argv", [str(SCRIPT), "validate", str(manifest)]), patch("sys.stdout", new_callable=io.StringIO) as output:
            self.assertEqual(blog.main(), 0)
            self.assertIn("kein CMS-Zugriff", output.getvalue())
        with patch("sys.argv", [str(SCRIPT), "create", str(manifest)]), patch.dict("os.environ", {}, clear=True), patch("sys.stderr", new_callable=io.StringIO) as output:
            self.assertEqual(blog.main(), 1)
            self.assertIn("DATAHUB_EDITOR_API_KEY fehlt", output.getvalue())
        self.assertFalse(self.receipt.exists())

    def test_lock_prevents_concurrent_create_and_is_released(self):
        path = self.root / "article.lock"
        with blog.lock(path):
            with self.assertRaises(FileExistsError):
                with blog.lock(path):
                    self.fail("Concurrent lock must fail")
        self.assertFalse(path.exists())

    def test_http_error_never_exposes_key_url_or_response_body(self):
        client = blog.Client("offline-secret-fixture")
        error = HTTPError("https://example.org/?secret=offline-secret-fixture", 403,
                          "offline-secret-fixture", {}, io.BytesIO(b"private article contents"))
        with patch.object(client.opener, "open", side_effect=error):
            with self.assertRaises(blog.DraftError) as caught:
                client.request("GET", "/api/users/me")
        self.assertNotIn("offline-secret-fixture", str(caught.exception))
        self.assertNotIn("private article", str(caught.exception))


if __name__ == "__main__":
    unittest.main()
