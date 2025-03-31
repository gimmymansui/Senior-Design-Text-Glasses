resource "google_compute_target_pool" "a25a8e8e299b7425daa92080dc71f70a" {
  description      = "{\"kubernetes.io/service-name\":\"convo-management/convo-upload-service\"}"
  health_checks    = ["https://www.googleapis.com/compute/beta/projects/group31-project-2025-451402/global/httpHealthChecks/k8s-cfbf78698b1f5e4c-node"]
  instances        = ["us-east4-b/gk3-group31-cluster-pool-2-bf65323e-8g7n", "us-east4-c/gk3-group31-cluster-pool-2-4a03f049-p1pc"]
  name             = "a25a8e8e299b7425daa92080dc71f70a"
  project          = "group31-project-2025-451402"
  region           = "us-east4"
  session_affinity = "NONE"
}
# terraform import google_compute_target_pool.a25a8e8e299b7425daa92080dc71f70a projects/group31-project-2025-451402/regions/us-east4/targetPools/a25a8e8e299b7425daa92080dc71f70a
