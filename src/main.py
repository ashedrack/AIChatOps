from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import openai
import os
import logging
from dotenv import load_dotenv
from pydantic import BaseModel
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Initialize metrics
REQUESTS_TOTAL = Counter('chatbot_requests_total', 'Total number of requests to the chatbot')
REQUEST_LATENCY = Histogram('chatbot_request_duration_seconds', 'Request latency in seconds')
ERROR_TOTAL = Counter('chatbot_errors_total', 'Total number of errors')

app = FastAPI(title="AI Chat API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure OpenAI API Key
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    logger.error("OpenAI API key not found!")

class ChatInput(BaseModel):
    prompt: str

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Chat API"}

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.post("/chat/")
async def chat_with_bot(chat_input: ChatInput):
    REQUESTS_TOTAL.inc()
    start_time = time.time()
    
    try:
        if not openai.api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")

        logger.info(f"Received chat request: {chat_input.prompt[:50]}...")
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "user",
                    "content": chat_input.prompt
                }
            ]
        )
        
        content = response["choices"][0]["message"]["content"]
        REQUEST_LATENCY.observe(time.time() - start_time)
        return content

    except openai.error.OpenAIError as e:
        ERROR_TOTAL.inc()
        logger.error(f"OpenAI API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")
    except Exception as e:
        ERROR_TOTAL.inc()
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
