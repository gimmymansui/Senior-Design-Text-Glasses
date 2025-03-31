resource "google_project_service" "cloudtrace_googleapis_com" {
  project = "261308802493"
  service = "cloudtrace.googleapis.com"
}
# terraform import google_project_service.cloudtrace_googleapis_com 261308802493/cloudtrace.googleapis.com
