resource "google_project_service" "oslogin_googleapis_com" {
  project = "261308802493"
  service = "oslogin.googleapis.com"
}
# terraform import google_project_service.oslogin_googleapis_com 261308802493/oslogin.googleapis.com
