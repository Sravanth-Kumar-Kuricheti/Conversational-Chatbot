from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routes.chat import router as chat_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and tables
    print("[PyChat AI] Initializing SQLite database...")
    init_db()
    print("[PyChat AI] Database initialized successfully.")
    yield
    print("[PyChat AI] Server shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ChatGPT-inspired AI conversational chatbot backend powered by FastAPI, SQLite, and Groq SDK.",
    lifespan=lifespan
)

# Configure CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Chat & Conversation API routes
app.include_router(chat_router)

@app.get("/")
def root():
    return {
        "app": "PyChat AI",
        "status": "online",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
