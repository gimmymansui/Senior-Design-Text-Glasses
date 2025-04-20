from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Request, Form
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from typing import Optional
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

class SummarizationParams(BaseModel):
    format: Optional[str] = "general"
    force_summarize: Optional[bool] = False
    max_length: Optional[int] = 1000
    min_length: Optional[int] = 100

@app.post("/summarize/")
async def summarize(
    username: str = Depends(authenticate), 
    file: UploadFile = File(...),
    format: Optional[str] = Form("conversation"),
    force_summarize: Optional[bool] = Form(True),
    max_length: Optional[int] = Form(1000),
    min_length: Optional[int] = Form(50)
):
    try:
        content = await file.read()
        text = content.decode("utf-8")

        if not text.strip():
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
        # Set system prompt for conversation summarization
        system_prompt = "You are a helpful assistant that specializes in summarizing conversational text, even when it's disjointed, informal, or lacks clear structure."
        
        # Default to conversation format for all inputs
        user_prompt_template = f"""Please summarize the following conversation text. 
Even if the text appears messy, disjointed, or contains slang/informal language, try to extract the main topics, themes, and any important information.

{"{text}"}

Provide your summary in this structured format:

1. Main Discussion Topics:
   - List the key subjects or themes that appear in the conversation
   - Include any specific technologies, projects, or systems mentioned

2. Key Points & Takeaways:
   - Extract any important information shared
   - Highlight any problems, solutions, or decisions mentioned
   
3. Action Items & Next Steps:
   - Note any tasks, follow-ups, or things to be done
   - Include any deadlines or timeframes mentioned

If parts of the text are unintelligible or too messy to interpret, focus on summarizing the parts you can understand and indicate if significant portions were unclear."""
        
        # Always force summarize for conversation text
        system_prompt += " Make your best effort to summarize the text, even if it appears to lack coherence or structure."
        
        # Fill in the template with the actual text
        user_prompt = user_prompt_template.format(text=text)
        
        # Call OpenRouter API for summarization
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": "anthropic/claude-3-haiku", 
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": max_length
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
