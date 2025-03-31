resource "google_logging_project_sink" "a_required" {
  destination            = "logging.googleapis.com/projects/group31-project-2025-451402/locations/global/buckets/_Required"
  filter                 = "LOG_ID(\"cloudaudit.googleapis.com/activity\") OR LOG_ID(\"externalaudit.googleapis.com/activity\") OR LOG_ID(\"cloudaudit.googleapis.com/system_event\") OR LOG_ID(\"externalaudit.googleapis.com/system_event\") OR LOG_ID(\"cloudaudit.googleapis.com/access_transparency\") OR LOG_ID(\"externalaudit.googleapis.com/access_transparency\")"
  name                   = "_Required"
  project                = "261308802493"
  unique_writer_identity = true
}
# terraform import google_logging_project_sink.a_required 261308802493###_Required
