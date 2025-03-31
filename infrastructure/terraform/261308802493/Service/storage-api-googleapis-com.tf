resource "google_project_service" "storage_api_googleapis_com" {
  project = "261308802493"
  service = "storage-api.googleapis.com"
}
# terraform import google_project_service.storage_api_googleapis_com 261308802493/storage-api.googleapis.com
