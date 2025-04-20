from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
    max_age=600,  # Cache preflight response for 10 minutes
)

@app.options("/{path:path}")
async def options_route(request: Request, path: str):
    return {}

security = HTTPBasic()

# Load authentication credentials from environment variables
AUTH_USERNAME = os.getenv("API_USERNAME", "admin")
AUTH_PASSWORD = os.getenv("API_PASSWORD", "password123")

# Get OpenRouter API key from environment variables
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not found in environment variables")

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
        
        # Call OpenRouter API for summarization
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": "anthropic/claude-3-haiku",  # Updated to correct model ID
            "messages": [
                {"role": "system", "content": "You are a helpful assistant that summarizes text in a structured format."},
                {"role": "user", "content": f"""Please summarize the following text in this structured format:
                
1. Summary:
   - First bullet point
   - Second bullet point
   - Additional bullet points as needed

2. Key Insights:
   - First key insight
   - Second key insight
   - Additional insights as needed

3. Action Items:
   - First recommended action
   - Second recommended action
   - Additional actions as needed

Here's the text to summarize:

{text}"""}
            ],
            "max_tokens": 1000
        }
        
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"OpenRouter API error: {response.text}")
        
        result = response.json()
        print(result)
        summary = result["choices"][0]["message"]["content"]
        
        return {"summary": summary}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
