import pytest
import httpx
import os
from base64 import b64encode
from dotenv import load_dotenv
import json

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
TEST_DATE = "26-02-2025"  # DD-MM-YYYY format
TEST_MONTH = "02"
TEST_YEAR = "2025"


@pytest.fixture
def client():
    """Fixture to provide an HTTP client"""
    with httpx.Client() as client:
        yield client


def test_store_conversation(client):
    """Test storing a conversation in the database using JSON format"""
    # Load the conversation data directly from the JSON file
    test_file_path = os.path.join(os.path.dirname(__file__), 'received_conversation.json')
    
    with open(test_file_path, 'r') as file:
        conversation_data = json.load(file)
    
    # Convert the conversation data to JSON string and prepare for upload
    json_content = json.dumps(conversation_data)
    files = {
        "conversation_file": ("conversation.json", json_content, "application/json")
    }
    data = {
        "user_id": str(TEST_USER_ID)
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


def test_search_conversations(client):
    """Test searching for all stored conversations for a user_id"""
    # First load the test file to get expected values
    test_file_path = os.path.join(os.path.dirname(__file__), 'received_conversation.json')
    with open(test_file_path, 'r') as file:
        test_data = json.load(file)
    
    json_payload = {
        "user_id": TEST_USER_ID
    }

    response = client.post(
        f"{BASE_URL}/search/",
        headers={"Content-Type": "application/json", **AUTH_HEADER},
        json=json_payload
    )

    assert response.status_code == 200, f"Unexpected status code: {response.status_code}"
    response_json = response.json()
    assert "conversations" in response_json, f"Response JSON: {response_json}"
    assert isinstance(response_json["conversations"], list), "Conversations should be a list"
    
    # Find the conversation we just stored
    found = False
    for conv in response_json["conversations"]:
        # Extract a snippet from the first transcript to search for
        expected_text_snippet = test_data["transcripts"][0]["text"][:50]
        if expected_text_snippet in conv["conversation"]:
            found = True
            # Verify the new fields exist
            assert "start_time" in conv, "start_time field missing"
            assert "end_time" in conv, "end_time field missing"
            assert "raw_data" in conv, "raw_data field missing"
            
            # Verify the values
            assert test_data["startTime"] == conv["start_time"], "Incorrect start_time"
            assert test_data["endTime"] == conv["end_time"], "Incorrect end_time"
            
            # Verify raw_data is valid JSON and has the expected structure
            raw_data = json.loads(conv["raw_data"]) if conv["raw_data"] else {}
            assert "id" in raw_data, "id missing from raw_data"
            assert "transcripts" in raw_data, "transcripts missing from raw_data"
            assert len(raw_data["transcripts"]) == len(test_data["transcripts"]), f"Expected {len(test_data['transcripts'])} transcript entries"
            
            break
    
    assert found, "Stored conversation with expected content not found"


def test_search_no_conversation(client):
    """Test searching for a non-existing user's conversations"""
    json_payload = {
        "user_id": 123456  # Use a non-existent user_id
    }

    response = client.post(
        f"{BASE_URL}/search/",
        headers={"Content-Type": "application/json", **AUTH_HEADER},
        json=json_payload
    )

    assert response.status_code == 200, f"Unexpected status code: {response.status_code}"
    assert "message" in response.json(), f"Response JSON: {response.json()}"
    assert response.json()["message"] == "No conversations found for the given user_id"

def test_unauthorized_access(client):
    """Test unauthorized access to the store API"""
    response = client.post(f"{BASE_URL}/store/")
    assert response.status_code == 401, f"Unexpected status code: {response.status_code}"
    assert "detail" in response.json(), f"Response JSON: {response.json()}"
    assert response.json()["detail"] == "Not authenticated"