import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

class Settings:
    PROJECT_NAME: str = "Esmeray AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Groq API configuration
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()
    DEFAULT_MODEL: str = os.getenv("GROQ_MODEL", os.getenv("DEFAULT_MODEL", "llama-3.3-70b-versatile")).strip()
    
    # Available Groq Models
    AVAILABLE_MODELS = [
        {
            "id": "llama-3.3-70b-versatile",
            "name": "Llama 3.3 70B",
            "description": "High capability versatile reasoning model on Groq LPU.",
            "context_window": 128000,
            "badge": "Recommended"
        },
        {
            "id": "qwen/qwen3.8-27b",
            "name": "Qwen 3.8 27B",
            "description": "Fast multi-turn conversation and vision analysis model.",
            "context_window": 32768,
            "badge": "Vision & Fast"
        },
        {
            "id": "openai/gpt-oss-120b",
            "name": "GPT OSS 120B",
            "description": "Ultra large parameter model for complex instruction and reasoning.",
            "context_window": 128000,
            "badge": "High Capacity"
        },
        {
            "id": "openai/gpt-oss-20b",
            "name": "GPT OSS 20B",
            "description": "Lightweight and efficient model for fast multi-turn conversations.",
            "context_window": 32768,
            "badge": "Fast"
        },
        {
            "id": "allam-2-7b",
            "name": "Allam 2 7B",
            "description": "Bilingual multi-turn conversation model fine-tuned for high efficiency.",
            "context_window": 8192,
            "badge": "Bilingual"
        }
    ]
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./pychat.db")
    
    # CORS
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
        ).split(",")
        if origin.strip()
    ]
    
    # System Prompt for Esmeray AI
    SYSTEM_PROMPT: str = (
        "You are Esmeray AI (symbol: ☪︎), an intelligent, helpful, and articulate AI assistant inspired by "
        "the best conversational models. You communicate with clarity, empathy, and technical precision. "
        "When explaining concepts or analyzing documents, use well-structured formatting with headings, "
        "bullet points, and clear sections. For code snippets, always specify the programming language "
        "in the markdown code fences. Provide thorough, high-quality, and direct answers without unnecessary fluff."
    )

settings = Settings()
