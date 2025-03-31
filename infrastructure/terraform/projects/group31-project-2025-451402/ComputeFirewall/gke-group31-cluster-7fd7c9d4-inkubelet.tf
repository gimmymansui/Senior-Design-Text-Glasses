resource "google_compute_firewall" "gke_group31_cluster_7fd7c9d4_inkubelet" {
  allow {
    ports    = ["10255"]
    protocol = "tcp"
  }

  direction     = "INGRESS"
  name          = "gke-group31-cluster-7fd7c9d4-inkubelet"
  network       = "https://www.googleapis.com/compute/v1/projects/group31-project-2025-451402/global/networks/default"
  priority      = 999
  project       = "group31-project-2025-451402"
  source_ranges = ["10.3.128.0/17"]
  source_tags   = ["gke-group31-cluster-7fd7c9d4-node"]
  target_tags   = ["gke-group31-cluster-7fd7c9d4-node"]
}
# terraform import google_compute_firewall.gke_group31_cluster_7fd7c9d4_inkubelet projects/group31-project-2025-451402/global/firewalls/gke-group31-cluster-7fd7c9d4-inkubelet
