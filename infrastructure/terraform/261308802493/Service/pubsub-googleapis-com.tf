resource "google_project_service" "pubsub_googleapis_com" {
  project = "261308802493"
  service = "pubsub.googleapis.com"
}
# terraform import google_project_service.pubsub_googleapis_com 261308802493/pubsub.googleapis.com
