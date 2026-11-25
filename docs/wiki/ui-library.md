# Gemeinsame UI-Bibliothek

Die Website verwendet die Website-Komponenten aus `@kieksme/kieksme-astro`. Die bisherigen Imports unter `src/components/ui/atoms/` und fünf `molecules/`-Dateien sind Kompatibilitätseinstiege, damit bestehende Seiten ihre Props und Slots behalten.

Die Markenfarben in `CustomStyles.astro` werden direkt aus dem Tokenpaket geladen. Die bisherige lokale Farbdatei bleibt vorerst als historische Referenz erhalten und ist nicht mehr eingebunden.

Zentrale Implementierung: `kieks.me.ui/packages/astro/src/website/`. Farben, Typografie, Karten-, Button- und Dekorationsvarianten stammen weiterhin aus der Website. Änderungen an diesen Komponenten werden zentral vorgenommen und vor einer Paketübernahme gegen die Website geprüft.

Bis zur Einrichtung der öffentlichen npm-Veröffentlichung liegen geprüfte Tarballs beider Pakete versioniert unter `vendor/`. Sie sind über `file:`-Dependencies und eine pnpm-Override für das transitive Tokenpaket eingebunden. Damit ist der Checkout eigenständig und braucht keinen benachbarten UI-Ordner. Tarballs stammen aus einem geprüften UI-Release; nicht direkt in den entpackten `node_modules` ändern.

Nach Paketupdates: Lockfile gezielt aktualisieren, anschließend Frozen-Installation, `pnpm run check:astro`, `pnpm exec vitest run` und `pnpm run build`. Sichtbare Änderungen an der Website benötigen zusätzlich einen Vergleich mit dem vorherigen Stand bei Hell/Dunkel und Desktop/Mobil. Die Extraktion selbst soll die Website nicht umgestalten.
