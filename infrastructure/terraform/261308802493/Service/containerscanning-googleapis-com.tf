resource "google_project_service" "containerscanning_googleapis_com" {
  project = "261308802493"
  service = "containerscanning.googleapis.com"
}
# terraform import google_project_service.containerscanning_googleapis_com 261308802493/containerscanning.googleapis.com
