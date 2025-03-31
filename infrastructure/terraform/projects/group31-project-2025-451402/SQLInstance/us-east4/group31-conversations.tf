resource "google_sql_database_instance" "group31_conversations" {
  database_version    = "MYSQL_8_0_37"
  instance_type       = "CLOUD_SQL_INSTANCE"
  maintenance_version = "MYSQL_8_0_37.R20241208.01_04"
  name                = "group31-conversations"
  project             = "group31-project-2025-451402"
  region              = "us-east4"

  settings {
    activation_policy = "NEVER"
    availability_type = "ZONAL"

    backup_configuration {
      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }

      enabled                        = true
      location                       = "us"
      start_time                     = "11:00"
      transaction_log_retention_days = 7
    }

    connector_enforcement = "NOT_REQUIRED"
    disk_autoresize       = true
    disk_autoresize_limit = 0
    disk_size             = 10
    disk_type             = "PD_SSD"
    edition               = "ENTERPRISE"

    insights_config {
      query_string_length = 0
    }

    ip_configuration {
      ipv4_enabled    = true
      private_network = "projects/group31-project-2025-451402/global/networks/default"
    }

    location_preference {
      zone = "us-east4-a"
    }

    maintenance_window {
      update_track = "canary"
    }

    pricing_plan = "PER_USE"
    tier         = "db-custom-2-8192"
  }
}
# terraform import google_sql_database_instance.group31_conversations projects/group31-project-2025-451402/instances/group31-conversations
