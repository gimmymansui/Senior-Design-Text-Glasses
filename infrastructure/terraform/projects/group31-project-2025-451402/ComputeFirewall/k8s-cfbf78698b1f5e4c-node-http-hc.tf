resource "google_compute_firewall" "k8s_cfbf78698b1f5e4c_node_http_hc" {
  allow {
    ports    = ["10256"]
    protocol = "tcp"
  }

  description        = "{\"kubernetes.io/cluster-id\":\"cfbf78698b1f5e4c\"}"
  destination_ranges = ["34.21.14.51"]
  direction          = "INGRESS"
  name               = "k8s-cfbf78698b1f5e4c-node-http-hc"
  network            = "https://www.googleapis.com/compute/v1/projects/group31-project-2025-451402/global/networks/default"
  priority           = 1000
  project            = "group31-project-2025-451402"
  source_ranges      = ["130.211.0.0/22", "209.85.152.0/22", "209.85.204.0/22", "35.191.0.0/16"]
  target_tags        = ["gke-group31-cluster-7fd7c9d4-node"]
}
# terraform import google_compute_firewall.k8s_cfbf78698b1f5e4c_node_http_hc projects/group31-project-2025-451402/global/firewalls/k8s-cfbf78698b1f5e4c-node-http-hc
