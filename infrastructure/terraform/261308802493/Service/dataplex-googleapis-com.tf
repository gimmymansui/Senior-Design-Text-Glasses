resource "google_project_service" "dataplex_googleapis_com" {
  project = "261308802493"
  service = "dataplex.googleapis.com"
}
# terraform import google_project_service.dataplex_googleapis_com 261308802493/dataplex.googleapis.com
