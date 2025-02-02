from pydantic import BaseModel, Field
from typing import List

class LLMRequest(BaseModel):
    prompt: str
    input_text: str

class Summary(BaseModel):
    title: str = Field(..., example="<Title>")
    date: str = Field(..., example="2021-01-01T00:00:00Z")
    ambulance_notes: str = Field(..., example="")
    timeline_events: List[dict] = Field(None, example=[{ "timestamp": "2021-01-01T00:00:00Z", "description": "<description>" }])
    medical_journal: dict = Field(None, example={"critical_information": [], "current_medications": [], "allergy_information": [] })
    status: str = Field(..., example="live")
    ai_summary: str = Field(None, example="")


