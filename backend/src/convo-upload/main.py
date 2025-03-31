from fastapi import FastAPI, UploadFile, Form, Query
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
import MySQLdb
import os
import yaml
import json

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

security = HTTPBasic()
DB_USER = os.getenv("DB_USER", "myuser")  # username
DB_PASSWORD = os.getenv("DB_PASSWORD", "mypass")  # password
DB_NAME = os.getenv("DB_NAME", "my_db")  # database name
DB_HOST = os.getenv("DB_HOST", "my_host")  # Private IP address of Cloud SQL instance
DB_PORT = os.getenv("DB_PORT", "3306")  # Default MySQL port
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
    description="Upload and store a conversation for a specific user with date information",
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
    user_id: int = Form(..., description="Unique identifier for the user"),
    date: str = Form(..., description="Date of the conversation (DD-MM-YYYY)"),
    month: str = Form(..., description="Month of the conversation"),
    year: str = Form(..., description="Year of the conversation"),
    conversation: UploadFile = None  # Remove Form() from UploadFile
):
    conn = None
    cursor = None
    try:
        content = await conversation.read()
        text = content.decode("utf-8")
        # Get a database connection
        conn = get_db_connection()
        cursor = conn.cursor()
        #execute SQL query
        cursor.execute(
            "INSERT INTO conversations (user_id, date, month, year, conversation) VALUES (%s, %s, %s, %s, %s)",
            (user_id, date, month, year, text),
        )
        conn.commit()
        return {"message": "Data stored successfully!", "user_id": user_id}

    except Exception as e:
        return {"error": str(e)}

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

class SearchRequest(BaseModel):
    user_id: int
    date: str
@app.post("/search/",
    response_model=dict,
    summary="Search for a conversation",
    description="Retrieve a conversation for a specific user and date",
    responses={
        200: {
            "description": "Successfully retrieved the conversation",
            "content": {
                "application/json": {
                    "example": {
                        "user_id": 123,
                        "date": "01-01-2024",
                        "conversation": "Example conversation content"
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
            "SELECT conversation FROM conversations WHERE user_id = %s AND date = %s",
            (request.user_id, request.date)
        )
        result = cursor.fetchone()

        if result:
            return {"user_id": request.user_id, "date": request.date, "conversation": result[0]}
        else:
            return {"message": "No conversation found for the given user_id and date"}

    except Exception as e:
        return {"error": str(e)}

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()