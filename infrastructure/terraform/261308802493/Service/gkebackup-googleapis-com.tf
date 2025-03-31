resource "google_project_service" "gkebackup_googleapis_com" {
  project = "261308802493"
  service = "gkebackup.googleapis.com"
}
# terraform import google_project_service.gkebackup_googleapis_com 261308802493/gkebackup.googleapis.com
