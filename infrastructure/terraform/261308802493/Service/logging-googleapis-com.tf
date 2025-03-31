resource "google_project_service" "logging_googleapis_com" {
  project = "261308802493"
  service = "logging.googleapis.com"
}
# terraform import google_project_service.logging_googleapis_com 261308802493/logging.googleapis.com
