resource "google_compute_route" "peering_route_fcf0c43e2a3c7cd7" {
  description = "Auto generated route via peering [servicenetworking-googleapis-com]."
  dest_range  = "10.113.32.0/24"
  name        = "peering-route-fcf0c43e2a3c7cd7"
  network     = "https://www.googleapis.com/compute/v1/projects/group31-project-2025-451402/global/networks/default"
  priority    = 0
  project     = "group31-project-2025-451402"
}
# terraform import google_compute_route.peering_route_fcf0c43e2a3c7cd7 projects/group31-project-2025-451402/global/routes/peering-route-fcf0c43e2a3c7cd7
