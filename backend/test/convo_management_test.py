import pytest
import httpx
import os
from base64 import b64encode
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
# Get API details from environment variables
BASE_URL = os.getenv("API_URL")
API_USERNAME = os.getenv("API_USERNAME")
API_PASSWORD = os.getenv("API_PASSWORD")
# Ensure all required environment variables are set
if not BASE_URL or not API_USERNAME or not API_PASSWORD:
    raise ValueError("Missing required environment variables. Check your .env file.")
# Basic authentication header
AUTH_HEADER = {
    "Authorization": "Basic " + b64encode(f"{API_USERNAME}:{API_PASSWORD}".encode()).decode()
}

# Sample test data
TEST_USER_ID = 9999
TEST_DATE = "2025-02-26"
TEST_MONTH = "02"
TEST_YEAR = "2025"
TEST_CONVERSATION = "This is a test conversation for unit testing."


@pytest.fixture
def client():
    """Fixture to provide an HTTP client"""
    with httpx.Client() as client:
        yield client


def test_store_conversation(client):
    """Test storing a conversation in the database"""
    files = {
        "conversation": ("conversation.txt", TEST_CONVERSATION, "text/plain")
    }
    data = {
        "user_id": str(TEST_USER_ID),
        "date": TEST_DATE,
        "month": TEST_MONTH,
        "year": TEST_YEAR
    }
    
    response = client.post(
        f"{BASE_URL}/store/",
        auth=(API_USERNAME, API_PASSWORD),
        files=files,
        data=data
    )

    assert response.status_code == 200, f"Unexpected status code: {response.status_code}"
    assert "message" in response.json(), f"Response JSON: {response.json()}"
    assert response.json()["message"] == "Data stored successfully!"


def test_search_conversation(client):
    """Test searching for a stored conversation"""
    json_payload = {
        "user_id": TEST_USER_ID,
        "date": TEST_DATE
    }

    response = client.post(
        f"{BASE_URL}/search/",
        headers={"Content-Type": "application/json", **AUTH_HEADER},
        json=json_payload
    )

    assert response.status_code == 200, f"Unexpected status code: {response.status_code}"
    response_json = response.json()
    assert "conversation" in response_json, f"Response JSON: {response_json}"
    assert response_json["conversation"] == TEST_CONVERSATION


def test_search_no_conversation(client):
    """Test searching for a non-existing conversation"""
    json_payload = {
        "user_id": 123456,  # Use a non-existent user_id
        "date": "2025-01-01"
    }

    response = client.post(
        f"{BASE_URL}/search/",
        headers={"Content-Type": "application/json", **AUTH_HEADER},
        json=json_payload
    )

    assert response.status_code == 200, f"Unexpected status code: {response.status_code}"
    assert "message" in response.json(), f"Response JSON: {response.json()}"
    assert response.json()["message"] == "No conversation found for the given user_id and date"


def test_unauthorized_access(client):
    """Test unauthorized access to the store API"""
    response = client.post(f"{BASE_URL}/store/")
    assert response.status_code == 401, f"Unexpected status code: {response.status_code}"
    assert "detail" in response.json(), f"Response JSON: {response.json()}"
    assert response.json()["detail"] == "Not authenticated"
