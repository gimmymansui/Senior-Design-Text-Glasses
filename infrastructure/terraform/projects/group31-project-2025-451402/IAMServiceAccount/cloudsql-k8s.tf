resource "google_service_account" "cloudsql_k8s" {
  account_id   = "cloudsql-k8s"
  display_name = "cloudsql-k8s"
  project      = "group31-project-2025-451402"
}
# terraform import google_service_account.cloudsql_k8s projects/group31-project-2025-451402/serviceAccounts/cloudsql-k8s@group31-project-2025-451402.iam.gserviceaccount.com
