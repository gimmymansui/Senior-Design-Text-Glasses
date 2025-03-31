resource "google_compute_firewall" "gke_group31_cluster_7fd7c9d4_exkubelet" {
  deny {
    ports    = ["10255"]
    protocol = "tcp"
  }

  direction     = "INGRESS"
  name          = "gke-group31-cluster-7fd7c9d4-exkubelet"
  network       = "https://www.googleapis.com/compute/v1/projects/group31-project-2025-451402/global/networks/default"
  priority      = 1000
  project       = "group31-project-2025-451402"
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["gke-group31-cluster-7fd7c9d4-node"]
}
# terraform import google_compute_firewall.gke_group31_cluster_7fd7c9d4_exkubelet projects/group31-project-2025-451402/global/firewalls/gke-group31-cluster-7fd7c9d4-exkubelet
