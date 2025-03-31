terraform {
  required_providers {

    google-beta = {
      source  = "hashicorp/google"
      version = "~> 6.26.0"
    }
  }
}
provider "google-beta" {
  project = "group31-project-2025-451402"
  region  = "us-east4"
}
