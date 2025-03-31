resource "google_project_service" "bigquery_googleapis_com" {
  project = "261308802493"
  service = "bigquery.googleapis.com"
}
# terraform import google_project_service.bigquery_googleapis_com 261308802493/bigquery.googleapis.com
