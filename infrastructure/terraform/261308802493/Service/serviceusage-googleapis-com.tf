resource "google_project_service" "serviceusage_googleapis_com" {
  project = "261308802493"
  service = "serviceusage.googleapis.com"
}
# terraform import google_project_service.serviceusage_googleapis_com 261308802493/serviceusage.googleapis.com
