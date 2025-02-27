from fastapi import FastAPI, UploadFile, Form, Query
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
import MySQLdb
import os

app = FastAPI()
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
@app.post("/store/")
async def store_conversation(
    username: str = Depends(authenticate),
    user_id: int = Form(...),
    date: str = Form(...),
    month: str = Form(...),
    year: str = Form(...),
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
@app.post("/search/")
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