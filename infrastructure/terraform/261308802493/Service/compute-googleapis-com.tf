resource "google_project_service" "compute_googleapis_com" {
  project = "261308802493"
  service = "compute.googleapis.com"
}
# terraform import google_project_service.compute_googleapis_com 261308802493/compute.googleapis.com
