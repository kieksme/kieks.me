terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  required_version = ">= 1.0"
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Zone für kieks.me
data "cloudflare_zone" "kieks_me" {
  name = "kieks.me"
}

# A-Record für die Hauptdomain
resource "cloudflare_record" "root" {
  zone_id = data.cloudflare_zone.kieks_me.id
  name    = "@"
  value   = var.root_ip
  type    = "A"
  proxied = true
}

# CNAME für www
resource "cloudflare_record" "www" {
  zone_id = data.cloudflare_zone.kieks_me.id
  name    = "www"
  value   = "kieks.me"
  type    = "CNAME"
  proxied = true
}

# MX Records für E-Mail
resource "cloudflare_record" "mx1" {
  zone_id  = data.cloudflare_zone.kieks_me.id
  name     = "@"
  value    = "aspmx.l.google.com"
  type     = "MX"
  priority = 1
  proxied  = false
}

resource "cloudflare_record" "mx2" {
  zone_id  = data.cloudflare_zone.kieks_me.id
  name     = "@"
  value    = "alt1.aspmx.l.google.com"
  type     = "MX"
  priority = 5
  proxied  = false
}

# SPF Record
resource "cloudflare_record" "spf" {
  zone_id = data.cloudflare_zone.kieks_me.id
  name    = "@"
  value   = "v=spf1 include:_spf.google.com ~all"
  type    = "TXT"
  proxied = false
}

# DMARC Record
resource "cloudflare_record" "dmarc" {
  zone_id = data.cloudflare_zone.kieks_me.id
  name    = "_dmarc"
  value   = "v=DMARC1; p=reject; rua=mailto:dmarc@kieks.me"
  type    = "TXT"
  proxied = false
} 