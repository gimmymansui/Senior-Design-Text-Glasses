resource "google_project_service" "storage_googleapis_com" {
  project = "261308802493"
  service = "storage.googleapis.com"
}
# terraform import google_project_service.storage_googleapis_com 261308802493/storage.googleapis.com
