resource "google_pubsub_topic" "container_analysis_notes_v1" {
  name    = "container-analysis-notes-v1"
  project = "group31-project-2025-451402"
}
# terraform import google_pubsub_topic.container_analysis_notes_v1 projects/group31-project-2025-451402/topics/container-analysis-notes-v1
