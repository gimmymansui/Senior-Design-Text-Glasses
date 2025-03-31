resource "google_project_service" "datastore_googleapis_com" {
  project = "261308802493"
  service = "datastore.googleapis.com"
}
# terraform import google_project_service.datastore_googleapis_com 261308802493/datastore.googleapis.com
