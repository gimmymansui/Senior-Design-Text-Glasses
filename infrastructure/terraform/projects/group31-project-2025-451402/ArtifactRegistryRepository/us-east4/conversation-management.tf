resource "google_artifact_registry_repository" "conversation_management" {
  cleanup_policy_dry_run = true
  format                 = "DOCKER"
  location               = "us-east4"
  mode                   = "STANDARD_REPOSITORY"
  project                = "group31-project-2025-451402"
  repository_id          = "conversation-management"
}
# terraform import google_artifact_registry_repository.conversation_management projects/group31-project-2025-451402/locations/us-east4/repositories/conversation-management
