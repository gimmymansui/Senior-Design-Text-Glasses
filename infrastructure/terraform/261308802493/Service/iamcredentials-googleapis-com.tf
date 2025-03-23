resource "google_project_service" "iamcredentials_googleapis_com" {
  project = "261308802493"
  service = "iamcredentials.googleapis.com"
}
# terraform import google_project_service.iamcredentials_googleapis_com 261308802493/iamcredentials.googleapis.com
