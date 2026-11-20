import json
import asyncio
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.database import get_db, SessionLocal
from app.models.chat import Conversation, Message
from app.schemas.chat import (
    ConversationSummary,
    ConversationDetail,
    ConversationCreate,
    ConversationUpdate,
    MessageResponse,
    SendMessageRequest,
    ModelOption,
    HealthResponse
)
from app.services.groq_service import groq_service
from app.services.recommendation_service import recommendation_service
from app.utils.helpers import generate_title_from_text, sanitize_text
from app.config import settings

router = APIRouter(prefix="/api", tags=["Chat & Conversations"])

@router.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint displaying system readiness and Groq status."""
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        groq_api_configured=groq_service.is_configured,
        default_model=settings.DEFAULT_MODEL
    )

@router.get("/models", response_model=List[ModelOption])
def list_models():
    """Returns the list of available Groq AI models."""
    return groq_service.get_models()

@router.get("/conversations", response_model=List[ConversationSummary])
def get_conversations(
    search: Optional[str] = Query(None, description="Search query to filter conversations"),
    db: Session = Depends(get_db)
):
    """
    Get all conversations ordered by recent activity.
    Supports real-time search across conversation titles and message content.
    """
    query = db.query(Conversation)

    if search and search.strip():
        term = f"%{search.strip()}%"
        # Join with messages to also search within message content
        query = query.outerjoin(Message).filter(
            or_(
                Conversation.title.ilike(term),
                Message.content.ilike(term)
            )
        ).distinct()

    conversations = query.order_by(desc(Conversation.updated_at)).all()

    results = []
    for conv in conversations:
        msgs = conv.messages
        last_msg = msgs[-1].content if msgs else None
        if last_msg and len(last_msg) > 60:
            last_msg = last_msg[:57] + "..."

        results.append(
            ConversationSummary(
                id=conv.id,
                title=conv.title,
                model=conv.model,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=len(msgs),
                last_message=last_msg
            )
        )
    return results

@router.post("/conversations", response_model=ConversationDetail, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: Optional[ConversationCreate] = None,
    db: Session = Depends(get_db)
):
    """
    Create a new empty conversation session.
    """
    model_name = payload.model if payload and payload.model else settings.DEFAULT_MODEL
    title = payload.title if payload and payload.title else "New Chat"

    conversation = Conversation(
        title=title,
        model=model_name
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return ConversationDetail(
        id=conversation.id,
        title=conversation.title,
        model=conversation.model,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[]
    )

@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve full conversation detail along with all chronologically ordered messages.
    """
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = [
        MessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            created_at=m.created_at,
            metadata_json=m.metadata_json
        )
        for m in conv.messages
    ]

    return ConversationDetail(
        id=conv.id,
        title=conv.title,
        model=conv.model,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=messages
    )

@router.patch("/conversations/{conversation_id}", response_model=ConversationDetail)
def update_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    db: Session = Depends(get_db)
):
    """
    Rename conversation title or change default model.
    """
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if payload.title is not None:
        cleaned_title = sanitize_text(payload.title)
        if cleaned_title:
            conv.title = cleaned_title
    if payload.model is not None:
        conv.model = payload.model

    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conv)

    messages = [
        MessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            created_at=m.created_at,
            metadata_json=m.metadata_json
        )
        for m in conv.messages
    ]

    return ConversationDetail(
        id=conv.id,
        title=conv.title,
        model=conv.model,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=messages
    )

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """
    Permanently delete a conversation and all its messages.
    """
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conv)
    db.commit()
    return None

@router.post("/conversations/{conversation_id}/messages")
async def send_message_stream(
    conversation_id: str,
    payload: SendMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Send user message, persist to SQLite, and stream Groq AI response via Server-Sent Events (SSE).
    """
    cleaned_content = sanitize_text(payload.content)
    has_image = False
    multimodal_content = None

    # Handle optional file/image attachment
    if payload.attachment:
        att_dict = payload.attachment.model_dump() if hasattr(payload.attachment, "model_dump") else payload.attachment.dict()
        display_text, multimodal_content = groq_service.process_attachment(att_dict, cleaned_content)
        cleaned_content = display_text
        has_image = bool(multimodal_content)

    if not cleaned_content:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Update model if provided
    selected_model = payload.model or conv.model or settings.DEFAULT_MODEL
    conv.model = selected_model

    # Save user message to database
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=cleaned_content
    )
    db.add(user_msg)

    # Auto-generate conversation title if it's currently a default title
    is_first_user_message = len(conv.messages) == 0 or conv.title in ["New Chat", "New Conversation", "Untitled"]
    if is_first_user_message:
        conv.title = generate_title_from_text(cleaned_content)

    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user_msg)
    db.refresh(conv)

    user_msg_id = user_msg.id
    current_title = conv.title

    # Retrieve conversation history up to this message
    history = [
        {"role": m.role, "content": m.content}
        for m in conv.messages[:-1] # Previous messages
    ]
    # Include current user message (multimodal or text)
    if multimodal_content:
        history.append({"role": "user", "content": multimodal_content})
    else:
        history.append({"role": "user", "content": cleaned_content})

    async def sse_event_generator():
        """
        Async generator producing Server-Sent Events formatted data stream.
        """
        # Yield metadata event acknowledging user message
        yield f"data: {json.dumps({'type': 'user_ack', 'user_message_id': user_msg_id, 'title': current_title})}\n\n"

        assistant_content_chunks = []

        try:
            async for token in groq_service.stream_completion(messages=history, model=selected_model, has_image=has_image):
                assistant_content_chunks.append(token)
                event_data = {"type": "token", "content": token}
                yield f"data: {json.dumps(event_data)}\n\n"

            # Complete response assembled
            full_assistant_content = "".join(assistant_content_chunks)

            # Generate smart recommendations, resources, and question suggestions
            rec_data = recommendation_service.generate_recommendations(
                user_prompt=cleaned_content,
                assistant_response=full_assistant_content
            )
            rec_json = json.dumps(rec_data) if rec_data else None

            # Persist assistant message into database using a fresh session
            with SessionLocal() as session:
                assistant_msg = Message(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=full_assistant_content,
                    metadata_json=rec_json
                )
                session.add(assistant_msg)

                # Touch updated_at
                c = session.query(Conversation).filter(Conversation.id == conversation_id).first()
                if c:
                    c.updated_at = datetime.now(timezone.utc)

                session.commit()
                session.refresh(assistant_msg)
                assistant_id = assistant_msg.id

            # Yield recommendations event if available
            if rec_data:
                yield f"data: {json.dumps({'type': 'recommendations', 'data': rec_data})}\n\n"

            # Yield done event with message ID
            done_data = {
                "type": "done",
                "message_id": assistant_id,
                "role": "assistant",
                "title": current_title,
                "metadata": rec_data
            }
            yield f"data: {json.dumps(done_data)}\n\n"

        except Exception as e:
            error_data = {"type": "error", "error": str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/conversations/{conversation_id}/retry")
async def retry_last_message(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """
    Remove the last assistant message and re-stream completion based on previous context.
    """
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = list(conv.messages)
    if not messages:
        raise HTTPException(status_code=400, detail="No messages to retry")

    # If the last message is an assistant message, delete it
    if messages[-1].role == "assistant":
        db.delete(messages[-1])
        db.commit()
        messages.pop()

    if not messages or messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="Cannot retry without a previous user prompt")

    selected_model = conv.model or settings.DEFAULT_MODEL

    history = [{"role": m.role, "content": m.content} for m in messages]

    async def sse_event_generator():
        assistant_content_chunks = []
        try:
            async for token in groq_service.stream_completion(messages=history, model=selected_model):
                assistant_content_chunks.append(token)
                event_data = {"type": "token", "content": token}
                yield f"data: {json.dumps(event_data)}\n\n"

            full_content = "".join(assistant_content_chunks)

            last_user_prompt = messages[-1].content if messages else ""
            rec_data = recommendation_service.generate_recommendations(
                user_prompt=last_user_prompt,
                assistant_response=full_content
            )
            rec_json = json.dumps(rec_data) if rec_data else None

            with SessionLocal() as session:
                assistant_msg = Message(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=full_content,
                    metadata_json=rec_json
                )
                session.add(assistant_msg)
                c = session.query(Conversation).filter(Conversation.id == conversation_id).first()
                if c:
                    c.updated_at = datetime.now(timezone.utc)
                session.commit()
                session.refresh(assistant_msg)
                assistant_id = assistant_msg.id

            if rec_data:
                yield f"data: {json.dumps({'type': 'recommendations', 'data': rec_data})}\n\n"

            done_data = {
                "type": "done",
                "message_id": assistant_id,
                "role": "assistant",
                "metadata": rec_data
            }
            yield f"data: {json.dumps(done_data)}\n\n"
        except Exception as e:
            error_data = {"type": "error", "error": str(e)}
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
