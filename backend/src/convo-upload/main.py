from fastapi import FastAPI, UploadFile, Form, Query, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import MySQLdb
import os
import yaml
import json
from typing import Union
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
app = FastAPI(
    title="Conversation Management API",
    description="API for storing and retrieving conversation data",
    version="1.0.0",
    terms_of_service="http://example.com/terms/",
    contact={
        "name": "API Support",
        "email": "support@example.com",
    },
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],  
    max_age=600, 
)

@app.options("/{path:path}")
async def options_route(request: Request, path: str):
    return {}

security = HTTPBasic()
DB_USER = os.getenv("DB_USER", "myuser")  
DB_PASSWORD = os.getenv("DB_PASSWORD", "mypass") 
DB_NAME = os.getenv("DB_NAME", "my_db")  
DB_HOST = os.getenv("DB_HOST", "my_host") 
DB_PORT = os.getenv("DB_PORT", "3306")  
#set up basic authentication
AUTH_USERNAME = os.getenv("API_USERNAME", "admin")
AUTH_PASSWORD = os.getenv("API_PASSWORD", "password123")
#set up database connection
def get_db_connection():
    return MySQLdb.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=int(DB_PORT),
        database=DB_NAME
    )
def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != AUTH_USERNAME or credentials.password != AUTH_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username
#store endpoint to store conversations to database
@app.post("/store/", 
    response_model=dict,
    summary="Store a conversation",
    description="Upload and store a conversation for a specific user with conversation JSON data",
    responses={
        200: {
            "description": "Successfully stored the conversation",
            "content": {
                "application/json": {
                    "example": {"message": "Data stored successfully!", "user_id": 123}
                }
            }
        },
        401: {
            "description": "Invalid authentication credentials",
        },
        500: {
            "description": "Database error occurred",
            "content": {
                "application/json": {
                    "example": {"error": "Database connection failed"}
                }
            }
        }
    }
)
async def store_conversation(
    username: str = Depends(authenticate),
    user_id: Union[int, str] = Form(..., description="Unique identifier for the user (can be integer or string)"),
    conversation_file: UploadFile = None
):
    conn = None
    cursor = None
    try:
        # Read and parse the conversation JSON file
        content = await conversation_file.read()
        conversation_data = json.loads(content.decode("utf-8"))
        
        # Extract information from the JSON file
        start_time = conversation_data.get("startTime", "")
        end_time = conversation_data.get("endTime", "")

        if start_time:
            date_parts = start_time.split("T")[0].split("-")
            if len(date_parts) == 3:
                year = date_parts[0]
                month = date_parts[1]
                day = date_parts[2]
                date = f"{day}-{month}-{year}"  
            else:
                date = ""
                month = ""
                year = ""
        else:
            date = ""
            month = ""
            year = ""
        
        speaker = ""
        if "transcripts" in conversation_data and len(conversation_data["transcripts"]) > 0:
            speaker = conversation_data["transcripts"][0].get("speaker", "")
        
        # Combine all text from transcripts
        combined_text = ""
        if "transcripts" in conversation_data:
            for transcript in conversation_data["transcripts"]:
                if "text" in transcript and "speaker" in transcript:

                    speaker_prefix = f"{transcript['speaker']}: "
                    if combined_text:  
                        combined_text += "\n"
                    combined_text += speaker_prefix + transcript["text"]
                elif "text" in transcript:
                    if combined_text:  
                        combined_text += "\n"
                    combined_text += transcript["text"]
            combined_text = combined_text.strip()
        
      
        conversation_metadata = json.dumps(conversation_data)

        conn = get_db_connection()
        cursor = conn.cursor()
 
        cursor.execute(
            "INSERT INTO conversations (user_id, date, month, year, conversation, speaker, start_time, end_time, raw_data) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (user_id, date, month, year, combined_text, speaker, start_time, end_time, conversation_metadata),
        )
        conn.commit()
        
        # Get the ID of the newly inserted row
        conversation_id = cursor.lastrowid
        
        return {"message": "Data stored successfully!", "user_id": user_id, "conversation_id": conversation_id}

    except Exception as e:
        return {"error": str(e)}

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

class SearchRequest(BaseModel):
    user_id: Union[int, str]
   
@app.post("/search/",
    response_model=dict,
    summary="Search for a conversation",
    description="Retrieve conversations for a specific user and return all unique IDs associated with them",
    responses={
        200: {
            "description": "Successfully retrieved the conversations",
            "content": {
                "application/json": {
                    "example": {
                        "user_id": 123,
                        "conversation_ids": [1, 2, 3],
                        "conversations": [
                            {
                                "id": 1,
                                "date": "01-01-2024",
                                "conversation": "Example conversation content"
                            }
                        ]
                    }
                }
            }
        },
        401: {
            "description": "Invalid authentication credentials",
        },
        404: {
            "description": "Conversation not found",
            "content": {
                "application/json": {
                    "example": {"message": "No conversation found for the given user_id and date"}
                }
            }
        }
    }
)
async def search_conversation(username: str = Depends(authenticate), request: SearchRequest = None):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM conversations WHERE user_id = %s",
            (request.user_id,)
        )
        results = cursor.fetchall()

        if not results:
            return {"message": "No conversations found for the given user_id"}

        conversation_ids = [row[0] for row in results]
        
        conversations = [
            {
                "id": row[0],
                "user_id": row[1],
                "date": row[2],
                "month": row[3],
                "year": row[4],
                "conversation": row[5],
                "speaker": row[6] if len(row) > 6 else None,
                "start_time": row[7] if len(row) > 7 else None,
                "end_time": row[8] if len(row) > 8 else None,
                "raw_data": row[9] if len(row) > 9 else None
            } for row in results
        ]

        return {
            "user_id": request.user_id, 
            "conversation_ids": conversation_ids,
            "conversations": conversations
        }

    except Exception as e:
        return {"error": str(e)}

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()