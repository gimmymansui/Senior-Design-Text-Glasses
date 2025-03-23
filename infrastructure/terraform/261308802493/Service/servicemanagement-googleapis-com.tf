resource "google_project_service" "servicemanagement_googleapis_com" {
  project = "261308802493"
  service = "servicemanagement.googleapis.com"
}
# terraform import google_project_service.servicemanagement_googleapis_com 261308802493/servicemanagement.googleapis.com
