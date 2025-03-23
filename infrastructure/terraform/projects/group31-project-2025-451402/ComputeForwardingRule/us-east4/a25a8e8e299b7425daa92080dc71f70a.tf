resource "google_compute_forwarding_rule" "a25a8e8e299b7425daa92080dc71f70a" {
  description           = "{\"kubernetes.io/service-name\":\"convo-management/convo-upload-service\"}"
  ip_address            = "34.21.14.51"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL"
  name                  = "a25a8e8e299b7425daa92080dc71f70a"
  network_tier          = "PREMIUM"
  port_range            = "80-80"
  project               = "group31-project-2025-451402"
  region                = "us-east4"
  target                = "https://www.googleapis.com/compute/beta/projects/group31-project-2025-451402/regions/us-east4/targetPools/a25a8e8e299b7425daa92080dc71f70a"
}
# terraform import google_compute_forwarding_rule.a25a8e8e299b7425daa92080dc71f70a projects/group31-project-2025-451402/regions/us-east4/forwardingRules/a25a8e8e299b7425daa92080dc71f70a
