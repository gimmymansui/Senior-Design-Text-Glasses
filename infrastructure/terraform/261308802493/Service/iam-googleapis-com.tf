resource "google_project_service" "iam_googleapis_com" {
  project = "261308802493"
  service = "iam.googleapis.com"
}
# terraform import google_project_service.iam_googleapis_com 261308802493/iam.googleapis.com
