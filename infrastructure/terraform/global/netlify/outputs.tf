output "site_url" {
  description = "Die URL der Netlify Site"
  value       = netlify_site.kieks_me.url
}

output "site_id" {
  description = "Die ID der Netlify Site"
  value       = netlify_site.kieks_me.id
}

output "deploy_key" {
  description = "Der Deploy Key für GitHub"
  value       = netlify_deploy_key.github.key
  sensitive   = true
}

output "build_hook_url" {
  description = "Die URL des Build Hooks"
  value       = netlify_build_hook.production.url
  sensitive   = true
} 