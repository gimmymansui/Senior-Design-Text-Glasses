resource "google_service_account" "docker_admin" {
  account_id   = "docker-admin"
  display_name = "docker-admin"
  project      = "group31-project-2025-451402"
}
# terraform import google_service_account.docker_admin projects/group31-project-2025-451402/serviceAccounts/docker-admin@group31-project-2025-451402.iam.gserviceaccount.com
