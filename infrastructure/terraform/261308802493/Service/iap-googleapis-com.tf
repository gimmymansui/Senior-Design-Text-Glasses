resource "google_project_service" "iap_googleapis_com" {
  project = "261308802493"
  service = "iap.googleapis.com"
}
# terraform import google_project_service.iap_googleapis_com 261308802493/iap.googleapis.com
