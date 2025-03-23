resource "google_project_service" "container_googleapis_com" {
  project = "261308802493"
  service = "container.googleapis.com"
}
# terraform import google_project_service.container_googleapis_com 261308802493/container.googleapis.com
