resource "google_project_service" "autoscaling_googleapis_com" {
  project = "261308802493"
  service = "autoscaling.googleapis.com"
}
# terraform import google_project_service.autoscaling_googleapis_com 261308802493/autoscaling.googleapis.com
