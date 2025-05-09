# Netlify-Konfiguration für kieks.me

Diese Terraform-Konfiguration verwaltet die Netlify-Ressourcen für die Domain kieks.me.

## Voraussetzungen

1. **Netlify Account**
   - Du benötigst einen Netlify Account
   - Die Domain kieks.me muss in deinem Netlify Account verfügbar sein

2. **Netlify API Token**
   - Erstelle einen API Token in Netlify:
     1. Gehe zu User Settings > Applications
     2. Klicke auf "New access token"
     3. Gib dem Token einen Namen (z.B. "Terraform")
     4. Wähle "Full access" als Berechtigung

3. **Terraform**
   - Terraform Version >= 1.0
   - Netlify Provider Version ~> 0.16.0

## Installation

1. Klone das Repository
2. Navigiere in das Verzeichnis:
   ```bash
   cd infrastructure/terraform/global/netlify
   ```

3. Initialisiere Terraform:
   ```bash
   terraform init
   ```

## Konfiguration

1. Erstelle eine `terraform.tfvars` Datei (wird nicht ins Git-Repository aufgenommen):
   ```hcl
   netlify_token = "your-netlify-token"
   ```

2. Alternativ kannst du die Variable auch als Umgebungsvariable setzen:
   ```bash
   export TF_VAR_netlify_token="your-netlify-token"
   ```

## Verwendung

1. Plane die Änderungen:
   ```bash
   terraform plan
   ```

2. Wende die Änderungen an:
   ```bash
   terraform apply
   ```

3. Um die Konfiguration zu zerstören:
   ```bash
   terraform destroy
   ```

## GitHub Actions Integration

Die Netlify-Konfiguration wird automatisch über GitHub Actions verwaltet. Der Workflow wird ausgeführt:
- Bei Push auf den `main` Branch
- Bei Pull Requests auf den `main` Branch
- Manuell über den "Run workflow" Button

### Workflow-Schritte

1. **Format Check**: Überprüft die Terraform-Formatierung
2. **Initialisierung**: Initialisiert Terraform
3. **Validierung**: Validiert die Konfiguration
4. **Plan**: Erstellt einen Plan (nur bei PRs)
5. **Apply**: Wendet Änderungen an (nur bei Push auf main)

### GitHub Secrets

Du musst folgende Secrets in deinem GitHub Repository einrichten:

1. `NETLIFY_TOKEN`: Dein Netlify API Token

So richtest du die Secrets ein:
1. Gehe zu deinem GitHub Repository
2. Navigiere zu "Settings" > "Secrets and variables" > "Actions"
3. Klicke auf "New repository secret"
4. Füge das Secret wie oben beschrieben hinzu

## Verwaltete Ressourcen

Die Konfiguration verwaltet folgende Netlify-Ressourcen:

- Site-Konfiguration mit Build-Einstellungen
- DNS-Zone und -Records
- Deploy Keys für GitHub
- Build Hooks
- Domain-Verifizierung

## Sicherheitshinweise

- Bewahre den Netlify API Token sicher auf
- Füge die `terraform.tfvars` Datei zu `.gitignore` hinzu
- Überprüfe die geplanten Änderungen vor dem Anwenden
- Die Deploy Keys und Build Hook URLs sind sensitive Daten

## Troubleshooting

1. **Fehler: Ungültiger API Token**
   - Überprüfe, ob der Token korrekt ist
   - Überprüfe, ob der Token die notwendigen Berechtigungen hat

2. **Fehler: Domain nicht verfügbar**
   - Überprüfe, ob die Domain in deinem Netlify Account verfügbar ist
   - Überprüfe die DNS-Konfiguration

3. **GitHub Actions Fehler**
   - Überprüfe, ob alle Secrets korrekt gesetzt sind
   - Schaue in die GitHub Actions Logs für detaillierte Fehlermeldungen

## Support

Bei Problemen oder Fragen, erstelle bitte ein Issue im Repository. 