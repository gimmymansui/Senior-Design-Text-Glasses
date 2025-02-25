from fastapi import FastAPI, UploadFile, Form
import MySQLdb
import os

app = FastAPI()
DB_USER = os.getenv("DB_USER", "myuser")  # username
DB_PASSWORD = os.getenv("DB_PASSWORD", "mypass")  # password
DB_NAME = os.getenv("DB_NAME", "my_db")  # database name
DB_HOST = os.getenv("DB_HOST", "my_host")  # Private IP address of Cloud SQL instance
DB_PORT = os.getenv("DB_PORT", "3306")  # Default MySQL port
#set up database connection
def get_db_connection():
    return MySQLdb.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=int(DB_PORT),
        database=DB_NAME
    )
#store endpoint to store conversations to database
@app.post("/store/")
async def store_conversation(
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
