resource "google_compute_firewall" "gke_group31_cluster_7fd7c9d4_vms" {
  allow {
    ports    = ["1-65535"]
    protocol = "tcp"
  }

  allow {
    ports    = ["1-65535"]
    protocol = "udp"
  }

  allow {
    protocol = "icmp"
  }

  direction     = "INGRESS"
  name          = "gke-group31-cluster-7fd7c9d4-vms"
  network       = "https://www.googleapis.com/compute/v1/projects/group31-project-2025-451402/global/networks/default"
  priority      = 1000
  project       = "group31-project-2025-451402"
  source_ranges = ["10.128.0.0/9"]
  target_tags   = ["gke-group31-cluster-7fd7c9d4-node"]
}
# terraform import google_compute_firewall.gke_group31_cluster_7fd7c9d4_vms projects/group31-project-2025-451402/global/firewalls/gke-group31-cluster-7fd7c9d4-vms
