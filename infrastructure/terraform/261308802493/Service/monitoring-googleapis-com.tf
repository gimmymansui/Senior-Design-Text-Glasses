resource "google_project_service" "monitoring_googleapis_com" {
  project = "261308802493"
  service = "monitoring.googleapis.com"
}
# terraform import google_project_service.monitoring_googleapis_com 261308802493/monitoring.googleapis.com
