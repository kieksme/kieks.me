# Versionierte UI-Pakete

Unveränderte `npm pack`-Artefakte aus [kieksme/kieks.me.ui](https://github.com/kieksme/kieks.me.ui), Quellcommit `4302bdb345fd04c2970bf805cf755598656d80a1`, Version `0.2.0`.

- `kieksme-kieksme-astro-0.2.0.tgz`: SHA-256 `a3649c510b9701cdd021a4db96dd8648ef38cd7ff66fcd980ba8a83ee3dde50b`
- `kieksme-kieksme-tokens-0.2.0.tgz`: SHA-256 `5e5f5b0977bc25352435b1d53be36945f18d9daab7f8bd8336ffefe5bd2e34bd`

Die Datei-Abhängigkeiten und ihre Integrität sind im pnpm-Lockfile festgehalten. Beide Pakete stammen aus demselben Quellstand; keine Änderungen direkt im Archiv vornehmen.

Zur Reproduktion im UI-Checkout `npm ci --ignore-scripts`, `npm run build` und `RELEASE_DIR=/tmp/kieksme-ui-release node .github/scripts/package-release.mjs` ausführen. Die Paketdateien aus diesem Verzeichnis übernehmen und das Verbraucher-Lockfile gezielt aktualisieren. Anschließend Frozen-Installation und Produktprüfungen ausführen.

Nach bestätigter npm-Veröffentlichung können die Dateiverweise durch exakt dieselbe Paketversion ersetzt werden. Keine Abhängigkeit auf einen benachbarten Checkout oder ein bewegliches `latest`.
