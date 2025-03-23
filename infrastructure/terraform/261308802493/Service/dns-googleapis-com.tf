resource "google_project_service" "dns_googleapis_com" {
  project = "261308802493"
  service = "dns.googleapis.com"
}
# terraform import google_project_service.dns_googleapis_com 261308802493/dns.googleapis.com
