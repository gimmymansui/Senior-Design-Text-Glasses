resource "google_compute_firewall" "k8s_fw_a25a8e8e299b7425daa92080dc71f70a" {
  allow {
    ports    = ["80"]
    protocol = "tcp"
  }

  description        = "{\"kubernetes.io/service-name\":\"convo-management/convo-upload-service\", \"kubernetes.io/service-ip\":\"34.21.14.51\"}"
  destination_ranges = ["34.21.14.51"]
  direction          = "INGRESS"
  name               = "k8s-fw-a25a8e8e299b7425daa92080dc71f70a"
  network            = "https://www.googleapis.com/compute/v1/projects/group31-project-2025-451402/global/networks/default"
  priority           = 1000
  project            = "group31-project-2025-451402"
  source_ranges      = ["0.0.0.0/0"]
  target_tags        = ["gke-group31-cluster-7fd7c9d4-node"]
}
# terraform import google_compute_firewall.k8s_fw_a25a8e8e299b7425daa92080dc71f70a projects/group31-project-2025-451402/global/firewalls/k8s-fw-a25a8e8e299b7425daa92080dc71f70a
