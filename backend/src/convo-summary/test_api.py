import requests
from requests.auth import HTTPBasicAuth
import json

API_URL = "your_api_url"  # Update with your API URL
USERNAME = "myuser"  # Update with your API username
PASSWORD = "mypass"  # Update with your API password
TEST_CONVERSATION_ID = 41  # ID of the conversation to summarize

def test_summarization_by_id():
    """Test the summarization API with a conversation ID."""
    # Create JSON payload with the conversation ID
    payload = {
        "conversation_id": TEST_CONVERSATION_ID,
        "max_length": 1000,
        "min_length": 50
    }
    
    # Make the API request
    response = requests.post(
        API_URL,
        json=payload,
        auth=HTTPBasicAuth(USERNAME, PASSWORD),
        headers={"Content-Type": "application/json"}
    )

    if response.status_code == 200:
        print(f"✅ Summary for conversation ID {TEST_CONVERSATION_ID}:")
        print(response.json()["summary"])
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_summarization_by_id()
