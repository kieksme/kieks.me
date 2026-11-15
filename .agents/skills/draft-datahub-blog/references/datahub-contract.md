# CMS-Vertrag vor jedem Schreibzugriff prüfen

Quelle: `kieksme/kieks.me.datahub`: `src/website.ts`, `src/editorial/seo.ts`, `src/payload.config.ts`, `src/access.ts`, `src/mcp.ts`, `docs/editorial/mcp.md`. Aktuelles Schema über MCP `getCollectionSchema`/`getConfigInfo` oder lesend im Repository prüfen. Bei Abweichungen Mapping zuerst korrigieren.

| Collection | Felder                                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `posts`    | `title`, eindeutiger `slug`, `excerpt`, `author` → `authors`, `category`, `tags: [{tag}]`, `contentRichText` (Lexical), `heroImage` → `media`, `seo`, `_status` |
| `authors`  | öffentliche Profile: `id`, `name`, `slug`, `_status`; keine Benutzerkonten                                                                                      |
| `media`    | Datei-Upload, `alt` zwingend, `websitePublished=false`; keine Versionen                                                                                         |
| `seo`      | `title`, `description`, `canonical`, `robots`, `openGraph: {title, description, image, imageAlt, type}`, `twitter: {card, title, description, image}`           |

Aktuell keine produktive Payload-Lokalisierung: Sprache ist kein Post-Feld. Keine `locale=en`-Writes, künstlichen Sprach-Slugs oder Ersatzposts. Varianten privat vorbereiten. Der Helper importiert ausschließlich ein deutsches Original; Mehrsprachigkeit bleibt bis zur geprüften CMS-Erweiterung blockiert. Auch Alttexte, SEO, Slugs, Beziehungen und Fallbacks müssen dann passen, nicht nur ein Queryparameter.

REST: `https://datahub.kieks.me/api`, Header `Authorization: users API-Key …`. Helper liest ausschließlich `DATAHUB_EDITOR_API_KEY` aus sicherer Umgebung. `PAYLOAD_BUILD_API_KEY` ist nur lesend. Vorhandene MCP-Tools erst entdecken; keine Verbindung behaupten.

Scope `website-editor-mcp`: Website-Entwürfe lesen/schreiben, **keine Medien lesen/hochladen**. Medien benötigen aktiven staff/admin-Zugang. Rechte nicht umgehen/ändern. Fehlen Rechte, generierte Bilder und Paket privat lokal liefern und tatsächlichen Importblocker melden.

Draft-Writes: `draft=true`, `_status=draft`, `autosave=false`. Kein Publish/Delete/Restore/Build-Webhook. Bestehende veröffentlichte Artikel nie stillschweigend überschreiben. Helper ist create-only; Bearbeitung vorhandener Drafts per MCP/Redaktion nur nach Auftrag, erneutem Lesen und Statusprüfung.

Preview `/preview/posts/<id>` benötigt native Browser-Session. API-Key reicht nicht; Link ist privat. Private Medien sind staff/admin in der Vorschau zugänglich. Medien nicht für Preview veröffentlichen. Erst bei ausdrücklich beauftragter Veröffentlichung Medienfreigabe, sichtbaren Autor und öffentliche Sprach-URLs separat prüfen; dieser Helper veröffentlicht nichts.

Mit dem [Mehrsprachigkeitskonzept (PR 15)](https://github.com/kieksme/kieks.me/pull/15) abstimmen: stabile Objektidentität, deutsche URLs erhalten, Englisch unter `/en/`, keine stillen deutschen Fallbacks und getrennte Freigabe je Sprache. Das Konzept ist keine produktive Schemafreigabe.
