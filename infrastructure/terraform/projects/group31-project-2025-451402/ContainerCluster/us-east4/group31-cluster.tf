resource "google_container_cluster" "group31_cluster" {
  provider = google-beta

  name    = "group31-cluster"
  location = "us-east4"
  
  enable_autopilot = true
  
  ip_allocation_policy {
    cluster_ipv4_cidr_block      = "10.3.128.0/17"
    services_ipv4_cidr_block = "34.118.224.0/20"
    stack_type               = "IPV4"
  }
  
  // REMOVE cluster_ipv4_cidr
  // REMOVE network_policy block
  // REMOVE or modify addons_config block
  // REMOVE cluster_autoscaling block
  // REMOVE default_max_pods_per_node
  // REMOVE enable_intranode_visibility
  // REMOVE enable_shielded_nodes
  
  // Keep only Autopilot-compatible settings
}
# terraform import google_container_cluster.group31_cluster group31-project-2025-451402/us-east4/group31-cluster
