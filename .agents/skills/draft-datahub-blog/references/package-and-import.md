# Privates Paket und Import

Außerhalb Git ein Arbeitsverzeichnis 0700 anlegen (`umask 077`). JSON/Bilder/Receipts dort aufbewahren; CMS wird nach Übernahme die Inhaltsquelle. Keine Artikel nach `src/content/` oder als zweiten Markdownkanal schreiben.

Struktur (Schema, kein fertiger Artikel/Autor):

```text
article.json
  brief: {audience, topic, goal, languages: ["de", "en"], authorId, cta: {label, href}}
  sources: [{url, title, accessedAt: "YYYY-MM-DD", supports: [geprüfte Aussagen]}]
  variants: [{language, slug, title, excerpt, category?, tags?: [string],
    contentRichText: LexicalRoot,
    image: {file: "hero-de.png", alt, prompt},
    seo: {title, description, openGraph: {title, description, imageAlt}}}]
```

Je interviewter Sprache genau eine vollständige Variante; `authorId` aus vorhandenen `authors` übernehmen. Bilder relativ zum Paket, PNG mindestens 1200×630. OG-Komposition 1,91:1 anstreben, wichtige Motive für Hero-Beschnitt innerhalb sicherer Ränder halten. Dieselbe Datei als Hero/OG verwenden. Bei verschiedenen Sprachalttexten vorerst getrennte private Medienobjekte vorsehen. Tatsächliches Bild und Prompt redaktionell prüfen.

Lexical-Root: `{"root":{"type":"root","version":1,"format":"","indent":0,"direction":null,"children":[...]}}`. Unterstützte Elemente: `paragraph`, `heading` (h2–h4), `text`, `linebreak`, `list`, `listitem`, `quote`, `link`. Kein HTML/JS/MDX, keine externen Bilder oder privaten API-Endpunkte. CTA und sichtbare Quellen im Inhalt führen; `sources` enthält zusätzlich den Faktenabgleich. Strukturprüfung ersetzt keine Wahrheits-/Sprach-/Bildprüfung.

Vom Website-Root (`SKILL` setzen):

```bash
SKILL=.agents/skills/draft-datahub-blog
python3 "$SKILL/scripts/draft_blog.py" validate /privater/pfad/article.json
python3 "$SKILL/scripts/draft_blog.py" create /privater/pfad/article.json
```

`validate` benötigt keinen Zugang und schreibt nichts. `create` prüft lokal, Sprachen, Konto, Autor und Slug **vor Writes**; lädt Bilder privat hoch und legt ausschließlich Drafts an. Schlüssel muss bereits sicher in `DATAHUB_EDITOR_API_KEY` bereitstehen, niemals inline angeben. Kein Redirect, kein Update/Publish/Delete und keine automatischen Write-Retries.

`article.receipt.json` (0600) speichert Paketfingerabdruck sowie echte Medien-/Post-IDs. Wiederholungen erkennen eigene unveränderte Drafts. Nach Teilfehler bleiben Medien privat; Receipt behalten und Fortsetzung prüfen. Bei Timeout vor Receipt-Eintrag Bestand lesend prüfen; niemals blind erneut hochladen. Keine automatische Lösch-Bereinigung. Lokaler Lock verhindert parallele Läufe desselben Pakets; eindeutiger Slug verhindert doppelte Posts, ersetzt keine Medientransaktion.

Nach Import echte Beziehungen/Status nochmals lesen. Redaktionellen Preview-Link und Blocker melden; keinen erfolgreichen Upload behaupten, wenn nur lokale Dateien existieren.
