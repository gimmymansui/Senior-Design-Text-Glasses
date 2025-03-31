resource "google_project_service" "sqladmin_googleapis_com" {
  project = "261308802493"
  service = "sqladmin.googleapis.com"
}
# terraform import google_project_service.sqladmin_googleapis_com 261308802493/sqladmin.googleapis.com
