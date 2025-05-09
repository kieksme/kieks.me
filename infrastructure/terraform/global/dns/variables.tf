variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

variable "root_ip" {
  description = "IP-Adresse für den A-Record der Hauptdomain"
  type        = string
} 