terraform {
  required_providers {
    netlify = {
      source  = "netlify/netlify"
      version = "~> 0.16.0"
    }
  }
  required_version = ">= 1.0"
}

provider "netlify" {
  token = var.netlify_token
}

# Site-Konfiguration
resource "netlify_site" "kieks_me" {
  name = "kieks-me"
  custom_domain = "kieks.me"
  
  build_settings {
    build_command = "pnpm build"
    publish_directory = "dist"
  }

  # Branch Deploy Konfiguration
  branch_deploy {
    branch = "main"
    deploy_context = "production"
  }

  # Form Handling
  form_handling {
    enabled = true
  }
}

# DNS-Konfiguration
resource "netlify_dns_zone" "kieks_me" {
  name = "kieks.me"
}

# Redirects
resource "netlify_deploy_key" "github" {
  title = "GitHub Deploy Key"
}

# Environment Variables
resource "netlify_build_hook" "production" {
  site_id = netlify_site.kieks_me.id
  branch  = "main"
}

# Domain-Verifizierung
resource "netlify_dns_record" "verification" {
  zone_id = netlify_dns_zone.kieks_me.id
  hostname = "@"
  type     = "TXT"
  value    = "netlify-site-verification=${netlify_site.kieks_me.site_id}"
} 