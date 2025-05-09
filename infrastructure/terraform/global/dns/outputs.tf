output "zone_id" {
  description = "Die Zone-ID von kieks.me"
  value       = data.cloudflare_zone.kieks_me.id
}

output "root_record" {
  description = "Details des A-Records für die Hauptdomain"
  value       = cloudflare_record.root
} 