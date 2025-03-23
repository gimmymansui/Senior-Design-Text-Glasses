resource "google_dns_managed_zone" "gke_group31_cluster_7fd7c9d4_dns" {
  cloud_logging_config {
    enable_logging = false
  }

  description   = "Private zone for GKE cluster \"group31-cluster\" with cluster suffix \"cluster.local.\" in project \"group31-project-2025-451402\" with scope \"CLUSTER_SCOPE\""
  dns_name      = "cluster.local."
  force_destroy = false

  labels = {
    goog-gke-node = "clouddns-autopilot"
  }

  name = "gke-group31-cluster-7fd7c9d4-dns"

  private_visibility_config {
    gke_clusters {
      gke_cluster_name = "projects/group31-project-2025-451402/locations/us-east4/clusters/group31-cluster"
    }
  }

  project    = "group31-project-2025-451402"
  visibility = "private"
}
# terraform import google_dns_managed_zone.gke_group31_cluster_7fd7c9d4_dns projects/group31-project-2025-451402/managedZones/gke-group31-cluster-7fd7c9d4-dns
