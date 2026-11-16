# Mehrsprachige Website und CMS-Vorschau

Deutsch behält seine bisherigen URLs. Mit `PAYLOAD_I18N=true` lädt der private
Build-Client zusätzlich `locale=en&fallback-locale=none&draft=false` in einen
eigenen Snapshot. Voraussetzung ist das aktivierte, migrierte Datahub-Backend
(`DATAHUB_I18N=true`), siehe dessen `docs/deployment/localization.md`.

Englisch liegt unter `/en/`: Startseite, Trainings-/Workshopübersicht und Blog;
veröffentlichte CMS-Übersetzungen erzeugen zusätzlich Inhalts-/Rechtsseiten,
Leistungen, MCP-Projekte, Autoren und Trainingsdetails. Inhalte fehlen bewusst,
solange ihre englische Fassung oder ihr öffentliches Trainerprofil nicht
veröffentlicht ist. Es gibt keinen deutschen Inhalts-Fallback auf englischen URLs.
Die englische Startseite und UI haben eigene englische Basistexte.

Der Sprachschalter ordnet Sprachfassungen anhand Collection und stabiler ID zu.
Nicht verfügbare Fassungen sind deaktiviert. Canonical, `html lang`, Open Graph,
hreflang/x-default und Sitemap verwenden die tatsächlich erzeugten Routen.
Technische Slugs bleiben erhalten; `pathSlug` bestimmt den übersetzten URL-Namen.

Die vier Workshop-Themen stammen aus der bestehenden Beratungsseite und sind
als Themen gekennzeichnet. Es werden keine Termine, Preise oder Trainer erfunden.
Veröffentlichte Datahub-Trainings ergänzen diese Übersicht mit ihren echten
Titeln, Beschreibungen und öffentlichen Trainerprofilen.

Die separate private Vorschau kann beim Start mit `STAGING_CMS_PREVIEW=true`
gegen das isolierte Staging-CMS bauen. `PAYLOAD_URL` und
`PAYLOAD_BUILD_API_KEY` bleiben Runtime-Secrets; der Schlüssel gehört zu einem
reinen `website-build`-Konto. Bei interner Docker-HTTP-Adresse ist zusätzlich
`PAYLOAD_ALLOW_PRIVATE_HTTP=true` erforderlich. Der Build ohne Opt-in hat
weiterhin keinen CMS-Zugriff. Produktion wird durch einen Merge nicht automatisch
auf mehrsprachige CMS-Abfragen umgestellt.

Die Gesamtvorschau ist nur hinter der Mitarbeitersitzung des Staging-Datahubs
unter `/preview/site/` erreichbar. Signatur, TTL, Nonce, private Cache-/Robots-
Header und privates Docker-Netz schützen auch CSS, JavaScript und Bilder.
