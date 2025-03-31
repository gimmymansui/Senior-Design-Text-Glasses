resource "google_service_account" "261308802493_compute" {
  account_id   = "261308802493-compute"
  display_name = "Compute Engine default service account"
  project      = "group31-project-2025-451402"
}
# terraform import google_service_account.261308802493_compute projects/group31-project-2025-451402/serviceAccounts/261308802493-compute@group31-project-2025-451402.iam.gserviceaccount.com
