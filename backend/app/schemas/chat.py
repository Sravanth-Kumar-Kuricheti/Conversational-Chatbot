from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class AttachmentPayload(BaseModel):
    name: str = Field(..., description="File name")
    type: str = Field(..., description="MIME type: application/pdf, image/png, image/jpeg, etc.")
    size: int = Field(..., description="File size in bytes")
    data: str = Field(..., description="Base64 data or data URL")

class MessageBase(BaseModel):
    role: str = Field(..., description="Role of the message author: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message text content")

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, description="Message text from user")
    role: str = Field(default="user", description="Message role")

class MessageResponse(MessageBase):
    id: str
    conversation_id: str
    created_at: datetime
    metadata_json: Optional[str] = None

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    title: Optional[str] = None
    model: Optional[str] = "qwen/qwen3.8-27b"

class ConversationCreate(ConversationBase):
    pass

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    model: Optional[str] = None

class ConversationSummary(BaseModel):
    id: str
    title: str
    model: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    last_message: Optional[str] = None

    class Config:
        from_attributes = True

class ConversationDetail(BaseModel):
    id: str
    title: str
    model: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True

class SendMessageRequest(BaseModel):
    content: str = Field(..., description="Content of the user message")
    model: Optional[str] = Field(None, description="Groq model to use for completion")
    attachment: Optional[AttachmentPayload] = Field(None, description="Optional attached PDF or image file")

class ModelOption(BaseModel):
    id: str
    name: str
    description: str
    context_window: int
    badge: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    groq_api_configured: bool
    default_model: str
