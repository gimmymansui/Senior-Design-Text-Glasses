resource "google_project_service" "dataform_googleapis_com" {
  project = "261308802493"
  service = "dataform.googleapis.com"
}
# terraform import google_project_service.dataform_googleapis_com 261308802493/dataform.googleapis.com
