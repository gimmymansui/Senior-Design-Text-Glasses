resource "google_compute_http_health_check" "k8s_cfbf78698b1f5e4c_node" {
  check_interval_sec  = 8
  description         = "{\"kubernetes.io/service-name\":\"k8s-cfbf78698b1f5e4c-node\"}"
  healthy_threshold   = 1
  name                = "k8s-cfbf78698b1f5e4c-node"
  port                = 10256
  project             = "group31-project-2025-451402"
  request_path        = "/healthz"
  timeout_sec         = 1
  unhealthy_threshold = 3
}
# terraform import google_compute_http_health_check.k8s_cfbf78698b1f5e4c_node projects/group31-project-2025-451402/global/httpHealthChecks/k8s-cfbf78698b1f5e4c-node
