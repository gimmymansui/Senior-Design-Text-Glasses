resource "google_project_service" "cloudapis_googleapis_com" {
  project = "261308802493"
  service = "cloudapis.googleapis.com"
}
# terraform import google_project_service.cloudapis_googleapis_com 261308802493/cloudapis.googleapis.com
