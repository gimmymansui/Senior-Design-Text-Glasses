import requests
from requests.auth import HTTPBasicAuth
import json

API_URL = "http://34.85.163.145/summarize/"  # Update with your API URL
USERNAME = "admin"  # Update with your API username
PASSWORD = "Group312025."  # Update with your API password
TEST_CONVERSATION_ID = 55 # ID of the conversation to summarize

def test_summarization_by_id():
    """Test the summarization API with a conversation ID."""
    # Create JSON payload with the conversation ID
    payload = {
        "conversation_id": TEST_CONVERSATION_ID,


    }

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