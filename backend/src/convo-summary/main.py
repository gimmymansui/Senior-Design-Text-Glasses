from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from transformers import pipeline
import os

app = FastAPI()
security = HTTPBasic()
os.environ["CUDA_VISIBLE_DEVICES"] = "" 
# Load authentication credentials from environment variables
AUTH_USERNAME = os.getenv("API_USERNAME", "admin")
AUTH_PASSWORD = os.getenv("API_PASSWORD", "password123")

# Load the public summarization model
summarizer = pipeline("summarization", model="facebook/bart-large-cnn",device="cpu")

def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != AUTH_USERNAME or credentials.password != AUTH_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@app.post("/summarize/")
async def summarize(username: str = Depends(authenticate), file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = content.decode("utf-8")

        if not text.strip():
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        summary = summarizer(text, max_length=100, min_length=30, do_sample=False)
        return {"summary": summary[0]["summary_text"]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
