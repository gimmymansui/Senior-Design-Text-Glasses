resource "google_project_service" "containerregistry_googleapis_com" {
  project = "261308802493"
  service = "containerregistry.googleapis.com"
}
# terraform import google_project_service.containerregistry_googleapis_com 261308802493/containerregistry.googleapis.com
