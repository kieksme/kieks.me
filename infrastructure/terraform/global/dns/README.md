# DNS-Management für kieks.me

Diese Terraform-Konfiguration verwaltet die DNS-Records für die Domain kieks.me über Cloudflare.

## Voraussetzungen

1. **Cloudflare Account**
   - Du benötigst einen Cloudflare Account mit der Domain kieks.me
   - Die Domain muss bereits in Cloudflare registriert sein

2. **Cloudflare API Token**
   - Erstelle einen API Token in Cloudflare mit den folgenden Berechtigungen:
     - Zone:Read
     - DNS:Edit
   - Der Token sollte auf die Zone kieks.me beschränkt sein

3. **Terraform**
   - Terraform Version >= 1.0
   - Cloudflare Provider Version ~> 4.0

## Installation

1. Klone das Repository
2. Navigiere in das Verzeichnis:
   ```bash
   cd infrastructure/terraform/global/dns
   ```

3. Initialisiere Terraform:
   ```bash
   terraform init
   ```

## Konfiguration

1. Erstelle eine `terraform.tfvars` Datei (wird nicht ins Git-Repository aufgenommen):
   ```hcl
   cloudflare_api_token = "your-api-token"
   root_ip             = "your-server-ip"
   ```

2. Alternativ kannst du die Variablen auch als Umgebungsvariablen setzen:
   ```bash
   export TF_VAR_cloudflare_api_token="your-api-token"
   export TF_VAR_root_ip="your-server-ip"
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

Die DNS-Konfiguration wird automatisch über GitHub Actions verwaltet. Der Workflow wird ausgeführt:
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

1. `CLOUDFLARE_API_TOKEN`: Dein Cloudflare API Token
2. `TF_VAR_ROOT_IP`: Die IP-Adresse für den A-Record

So richtest du die Secrets ein:
1. Gehe zu deinem GitHub Repository
2. Navigiere zu "Settings" > "Secrets and variables" > "Actions"
3. Klicke auf "New repository secret"
4. Füge die Secrets wie oben beschrieben hinzu

### Pull Request Integration

Bei Pull Requests wird automatisch:
- Ein Terraform Plan erstellt
- Der Plan als Kommentar im PR gepostet
- Die Validierung der Konfiguration durchgeführt

## Verwaltete DNS-Records

Die Konfiguration verwaltet folgende DNS-Records:

- A-Record für die Hauptdomain (@)
- CNAME für www
- MX-Records für E-Mail (Google Workspace)
- SPF-Record für E-Mail-Authentifizierung
- DMARC-Record für E-Mail-Authentifizierung

## Sicherheitshinweise

- Bewahre den Cloudflare API Token sicher auf
- Füge die `terraform.tfvars` Datei zu `.gitignore` hinzu
- Überprüfe die geplanten Änderungen vor dem Anwenden

## Troubleshooting

1. **Fehler: Zone nicht gefunden**
   - Überprüfe, ob die Domain in Cloudflare registriert ist
   - Überprüfe die API Token Berechtigungen

2. **Fehler: Ungültiger API Token**
   - Überprüfe, ob der Token korrekt ist
   - Überprüfe, ob der Token die notwendigen Berechtigungen hat

3. **GitHub Actions Fehler**
   - Überprüfe, ob alle Secrets korrekt gesetzt sind
   - Schaue in die GitHub Actions Logs für detaillierte Fehlermeldungen

## Support

Bei Problemen oder Fragen, erstelle bitte ein Issue im Repository. 