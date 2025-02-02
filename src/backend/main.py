from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from bson import ObjectId
from dotenv import load_dotenv
import httpx
from models import Summary, LLMRequest
import logging
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import random
from llm.journal_prompt import prompt_llm_vllm_guided_json_with_medical_journal
from llm.transcription_prompt import prompt_llm_vllm_guided_json_with_transcription_text
import json
from datetime import datetime, timedelta
from demo_data import demo_data

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Check if environment variables are loaded
MONGODB_ROOT_USER = os.getenv('MONGODB_ROOT_USER')
MONGODB_ROOT_PASSWORD = os.getenv('MONGODB_ROOT_PASSWORD')

if not MONGODB_ROOT_USER or not MONGODB_ROOT_PASSWORD:
    logger.error("Environment variables for MongoDB credentials are not set")
    raise RuntimeError("Environment variables for MongoDB credentials are not set")

app = FastAPI(title="MongoDB Collections API", description="API for interacting with MongoDB collections", version="1.0")

# Allow all origins (unsafe for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change "*" to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# MongoDB connection
MONGO_URI = f"mongodb://{MONGODB_ROOT_USER}:{MONGODB_ROOT_PASSWORD}@mongo-db:27017/"
try:
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.documents
    logger.info("Connected to MongoDB")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    raise RuntimeError(f"Failed to connect to MongoDB: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    client.close()
    logger.info("MongoDB connection closed")

def serialize_mongo_document(document):
    if document:
        document["_id"] = str(document["_id"])
    return document

#############
## Summary ##
#############
@app.get("/db/summaries/", tags=["summary"])
async def read_summaries():
    summaries = await db.summary.find().sort("created_at", -1).to_list(1000)
    return [serialize_mongo_document(summary) for summary in summaries]

@app.get("/db/summaries/{summary_id}", tags=["summary"])
async def read_summary(summary_id: str):
    summary = await db.summary.find_one({"_id": ObjectId(summary_id)})
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    return serialize_mongo_document(summary)

@app.post("/db/summaries/", tags=["summary"], response_model=Summary)
async def create_summary(summary: Summary):
    summary_dict = summary.dict()
    summary_dict["created_at"] = datetime.utcnow()
    summary_dict["edited_at"] = datetime.utcnow()
    result = await db.summary.insert_one(summary_dict)
    new_summary = await db.summary.find_one({"_id": result.inserted_id})
    return serialize_mongo_document(new_summary)

@app.put("/db/summaries/{summary_id}", tags=["summary"], response_model=Summary)
async def update_summary(summary_id: str, summary: Summary | dict):
    if isinstance(summary, dict):
        update_data = summary
    else:    
        update_data = {k: v for k, v in summary.dict().items() if v is not None}
    
    # Update the edited_at field
    update_data["edited_at"] = datetime.utcnow()
    
    # Update the summary
    result = await db.summary.update_one({"_id": ObjectId(summary_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Summary not found")
    
    updated_summary = await db.summary.find_one({"_id": ObjectId(summary_id)})
    return serialize_mongo_document(updated_summary)

@app.delete("/db/summaries/{summary_id}", tags=["summary"])
async def delete_summary(summary_id: str):
    result = await db.summary.delete_one({"_id": ObjectId(summary_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Summary not found")
    return {"message": "Summary deleted"}


###############
## LLM Model ##
###############
@app.post("/llm/transcription", tags=["llm"])
async def transcription_endpoint(request: LLMRequest):
    try:
        response = prompt_llm_vllm_guided_json_with_transcription_text(
            endpoint_url="http://89.169.97.156:1337",
            model_path="/root/.cache/models--meta-llama--Llama-3.3-70B-Instruct/snapshots/6f6073b423013f6a7d4d9f39144961bfbfbc386b",
            system_prompt=request.prompt,
            transcription_text=request.input_text
        )
        if response is None:
            raise HTTPException(status_code=500, detail="Error processing transcription text")
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/llm/medical_journal", tags=["llm"])
async def medical_journal_endpoint(request: LLMRequest):
    try:
        response = prompt_llm_vllm_guided_json_with_medical_journal(
            endpoint_url="http://89.169.97.156:1337",
            model_path="/root/.cache/models--meta-llama--Llama-3.3-70B-Instruct/snapshots/6f6073b423013f6a7d4d9f39144961bfbfbc386b",
            system_prompt=request.prompt,
            medical_journal=request.input_text
        )
        if response is None:
            raise HTTPException(status_code=500, detail="Error processing medical journal")
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


##########
## Demo ##
##########
@app.get("/test/1", tags=["demo"])
async def test():
    transcription_response = await transcription_endpoint(demo_data[0]["transcription"])
    if transcription_response is None:
        raise HTTPException(status_code=500, detail="Error processing transcription")
    elif "choices" not in transcription_response or len(transcription_response["choices"]) == 0:
        raise HTTPException(status_code=500, detail="No transcription choices found")
    return json.loads(transcription_response["choices"][2]["message"]["content"])

@app.get("/test/2", tags=["demo"])
async def test():
    journal_response = await medical_journal_endpoint(demo_data[2]["journal"])
    if journal_response is None:
        raise HTTPException(status_code=500, detail="Error processing transcription")
    elif "choices" not in journal_response or len(journal_response["choices"]) == 0:
        raise HTTPException(status_code=500, detail="No transcription choices found")
    return json.loads(journal_response["choices"][0]["message"]["content"])


@app.get("/demo/", tags=["demo"])
async def demo(i: int = 0):

    # Check that demo_data has the required index
    if i >= len(demo_data):
        raise HTTPException(status_code=404, detail="Demo not found")

    # Create 5 mock timeline events
    mock_timeline_events = [
        { "timestamp": "2021-01-01T15:11:15Z", "description": "Call received" },
        { "timestamp": "2021-01-01T15:23:00Z", "description": "Ambulance dispatched" },
        { "timestamp": "2021-01-01T15:34:00Z", "description": "Ambulance arrived" },
        { "timestamp": "2021-01-01T15:40:00Z", "description": "Ambulance heading to hospital" },
        { "timestamp": "2021-01-01T15:44:00Z", "description": "Ambulance arrived at hospital" }
    ]
    
    # Create a new summary¨
    summary = Summary(
        title=f"Emergency Response #{random.randint(100, 999)}",
        date="2021-01-01T15:11:15Z",
        ambulance_notes="",
        timeline_events=mock_timeline_events[:1],
        medical_journal={ "critical_information": [], "current_medications": [], "allergy_information": [] },
        status="live",
        ai_summary=""
    )
    new_summary = await create_summary(summary)

    # Wait and update timeline_events
    await asyncio.sleep(5)
    await update_summary(new_summary["_id"], {"timeline_events": mock_timeline_events[:2]})
    await asyncio.sleep(5)
    await update_summary(new_summary["_id"], {"timeline_events": mock_timeline_events[:3]})
    await asyncio.sleep(5)
    await update_summary(new_summary["_id"], {"timeline_events": mock_timeline_events[:4]})
    await asyncio.sleep(5)
    await update_summary(new_summary["_id"], {"timeline_events": mock_timeline_events})
    await asyncio.sleep(1)

    # Wait and process the summary
    await update_summary(new_summary["_id"], {"status": "processing"})
    await asyncio.sleep(1)
    
    # Call the transcription endpoint
    transcription_response = await transcription_endpoint(demo_data[i]["transcription"])
    if transcription_response is None:
        raise HTTPException(status_code=500, detail="Error processing transcription")
    elif "choices" not in transcription_response or len(transcription_response["choices"]) == 0:
        raise HTTPException(status_code=500, detail="No transcription choices found")
    transcription = json.loads(transcription_response["choices"][0]["message"]["content"])

    # Call the medical journal endpoint
    journal_response = await medical_journal_endpoint(demo_data[i]["journal"])
    if journal_response is None:
        raise HTTPException(status_code=500, detail="Error processing transcription")
    elif "choices" not in journal_response or len(journal_response["choices"]) == 0:
        raise HTTPException(status_code=500, detail="No transcription choices found")
    journal = json.loads(journal_response["choices"][0]["message"]["content"])

    # Convert the transcription timeline events to ISO format
    base_date = datetime.fromisoformat(new_summary["date"])
    for event in transcription["timeline_events"]:
        minutes, seconds = map(int, event["timestamp"].strip("[]").split(":"))
        event_time = base_date + timedelta(minutes=minutes, seconds=seconds)
        event["timestamp"] = event_time.isoformat()

    # Update the summary with the AI-generated information
    await update_summary(new_summary["_id"], {"status": "completed", "medical_journal": journal["medical_journal"], "ai_summary": transcription["concise_summary"], "timeline_events": transcription["timeline_events"], "ambulance_notes": transcription["relevant_medical_info"]})




