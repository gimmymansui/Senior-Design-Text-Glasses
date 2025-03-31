resource "google_compute_global_address" "default_ip_range" {
  address       = "10.113.32.0"
  address_type  = "INTERNAL"
  name          = "default-ip-range"
  network       = "https://www.googleapis.com/compute/v1/projects/group31-project-2025-451402/global/networks/default"
  prefix_length = 20
  project       = "group31-project-2025-451402"
  purpose       = "VPC_PEERING"
}
# terraform import google_compute_global_address.default_ip_range projects/group31-project-2025-451402/global/addresses/default-ip-range
