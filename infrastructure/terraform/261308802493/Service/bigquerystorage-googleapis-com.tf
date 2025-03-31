resource "google_project_service" "bigquerystorage_googleapis_com" {
  project = "261308802493"
  service = "bigquerystorage.googleapis.com"
}
# terraform import google_project_service.bigquerystorage_googleapis_com 261308802493/bigquerystorage.googleapis.com
