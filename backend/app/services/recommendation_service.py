import re
import json
from typing import Dict, Any, List, Optional
from app.config import settings

# Verified trusted resources mapping (No invented or hallucinated URLs)
VERIFIED_RESOURCE_KNOWLEDGE_BASE = [
    {
        "keywords": ["quantum", "qubit", "superposition", "entanglement"],
        "resources": [
            {
                "title": "IBM Quantum Platform & Qiskit",
                "description": "Access real quantum hardware and open-source Qiskit SDK tutorials.",
                "source": "ibm.com",
                "url": "https://www.ibm.com/quantum",
                "badge": "Hardware & SDK"
            },
            {
                "title": "Quantum Computing (Wikipedia)",
                "description": "Foundational overview of quantum information theory, gates, and algorithms.",
                "source": "wikipedia.org",
                "url": "https://en.wikipedia.org/wiki/Quantum_computing",
                "badge": "Reference"
            }
        ],
        "default_tools": [
            {"name": "Qiskit", "category": "Quantum SDK"},
            {"name": "Cirq", "category": "Google Quantum Framework"}
        ],
        "suggested_questions": [
            "How does quantum superposition differ from classical probability?",
            "What is quantum entanglement and how does it work?",
            "What are the most promising real-world applications of quantum computing?"
        ]
    },
    {
        "keywords": ["python", "fastapi", "uvicorn", "pydantic", "sqlalchemy"],
        "resources": [
            {
                "title": "FastAPI Official Documentation",
                "description": "High performance, easy to learn, fast to code, ready for production.",
                "source": "fastapi.tiangolo.com",
                "url": "https://fastapi.tiangolo.com/",
                "badge": "Official Docs"
            },
            {
                "title": "Python 3 Documentation",
                "description": "Standard library reference, built-in types, and async programming guides.",
                "source": "python.org",
                "url": "https://docs.python.org/3/",
                "badge": "Language Reference"
            }
        ],
        "default_tools": [
            {"name": "Pydantic", "category": "Data Validation"},
            {"name": "SQLAlchemy", "category": "Database ORM"}
        ],
        "suggested_questions": [
            "How do I handle background tasks and lifespan events in FastAPI?",
            "What are the best practices for SQLAlchemy connection pooling?",
            "How does Pydantic v2 improve validation performance?"
        ]
    },
    {
        "keywords": ["react", "vite", "javascript", "tailwind", "css", "frontend"],
        "resources": [
            {
                "title": "React Official Documentation",
                "description": "The library for web and native user interfaces with modern React Hooks.",
                "source": "react.dev",
                "url": "https://react.dev/",
                "badge": "Official Docs"
            },
            {
                "title": "MDN Web Docs",
                "description": "Comprehensive resources for developers, by developers for modern Web standards.",
                "source": "developer.mozilla.org",
                "url": "https://developer.mozilla.org/",
                "badge": "Web Standard"
            }
        ],
        "default_tools": [
            {"name": "Vite", "category": "Frontend Build Tool"},
            {"name": "Tailwind CSS", "category": "Utility CSS"}
        ],
        "suggested_questions": [
            "When should I use useMemo versus useCallback in React?",
            "How do I optimize React re-renders with large lists?",
            "What are the best practices for structuring Tailwind components?"
        ]
    },
    {
        "keywords": ["groq", "llm", "llama", "ai", "inference", "artificial intelligence", "qwen"],
        "resources": [
            {
                "title": "Groq Console & Documentation",
                "description": "Ultra-fast LPU inference engine for state-of-the-art open-source LLMs.",
                "source": "console.groq.com",
                "url": "https://console.groq.com/docs/",
                "badge": "LPU Inference"
            },
            {
                "title": "Hugging Face Open LLM Leaderboard",
                "description": "Track, rank, and evaluate open LLMs and modern foundation architectures.",
                "source": "huggingface.co",
                "url": "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard",
                "badge": "Benchmarks"
            }
        ],
        "default_tools": [
            {"name": "Groq SDK", "category": "High Speed Inference"},
            {"name": "LangChain", "category": "LLM Orchestration"}
        ],
        "suggested_questions": [
            "How does Groq LPU architecture achieve ultra-low token latency?",
            "What are the best prompt engineering techniques for reasoning models?",
            "How can I implement token streaming in production applications?"
        ]
    },
    {
        "keywords": ["pdf", "document", "extract", "resume", "report", "file", "invoice"],
        "resources": [
            {
                "title": "PyPDF Documentation",
                "description": "Pure-python PDF library capable of extracting, splitting, and merging files.",
                "source": "pypdf.readthedocs.io",
                "url": "https://pypdf.readthedocs.io/",
                "badge": "Document Engine"
            },
            {
                "title": "Pillow (PIL Fork) Documentation",
                "description": "Python imaging library for image opening, manipulation, and format support.",
                "source": "pillow.readthedocs.io",
                "url": "https://pillow.readthedocs.io/",
                "badge": "Image Processing"
            }
        ],
        "default_tools": [
            {"name": "pypdf", "category": "PDF Extraction"},
            {"name": "Pillow", "category": "Image Processing"}
        ],
        "suggested_questions": [
            "Can you extract the main action items from this document?",
            "What are the key statistical figures or data points mentioned?",
            "Could you format a table summarizing this document?"
        ]
    },
    {
        "keywords": ["deploy", "render", "vercel", "github", "docker", "hosting", "cloud"],
        "resources": [
            {
                "title": "Render Cloud Hosting",
                "description": "Build, deploy, and scale web apps, APIs, and databases with free SSL.",
                "source": "render.com",
                "url": "https://render.com/docs",
                "badge": "Cloud Backend"
            },
            {
                "title": "Vercel Platform Documentation",
                "description": "Develop, preview, and ship frontend experiences with global edge networks.",
                "source": "vercel.com",
                "url": "https://vercel.com/docs",
                "badge": "Edge Frontend"
            }
        ],
        "default_tools": [
            {"name": "Render", "category": "Backend Hosting"},
            {"name": "Vercel", "category": "Frontend Edge CDN"}
        ],
        "suggested_questions": [
            "How do I set up persistent SQLite storage on Render?",
            "What environment variables are needed for Vercel deployment?",
            "How can I configure GitHub Actions for automated CI/CD?"
        ]
    }
]

class RecommendationService:
    def should_recommend(self, user_prompt: str, assistant_response: str) -> bool:
        """
        Determines whether a message is substantive enough for recommendations.
        Avoids showing generic recommendations on simple greetings or trivial queries.
        """
        trivial_greetings = {"hi", "hello", "hey", "test", "thanks", "thank you", "bye", "ok", "okay", "cool", "yo"}
        cleaned_prompt = user_prompt.strip().lower()

        if cleaned_prompt in trivial_greetings:
            return False

        word_count = len(assistant_response.split())
        # Must be at least 30 words and have technical or conceptual substance
        return word_count >= 30

    def generate_recommendations(
        self,
        user_prompt: str,
        assistant_response: str
    ) -> Optional[Dict[str, Any]]:
        """
        Generates structured 'My recommendation', verified 'Related resources',
        and clickable suggested questions.
        """
        if not self.should_recommend(user_prompt, assistant_response):
            return None

        text_to_match = (user_prompt + " " + assistant_response).lower()

        # Find best matching resource cluster
        matched_cluster = None
        for cluster in VERIFIED_RESOURCE_KNOWLEDGE_BASE:
            for kw in cluster["keywords"]:
                if kw in text_to_match:
                    matched_cluster = cluster
                    break
            if matched_cluster:
                break

        # Fallback cluster if no exact keyword match
        if not matched_cluster:
            matched_cluster = VERIFIED_RESOURCE_KNOWLEDGE_BASE[0] # Quantum/Foundations

        # Create tailored practical next steps based on query context
        next_steps = [
            "Review the core principles explained above and test with a practical code example.",
            "Inspect the official documentation to explore advanced configurations and best practices.",
            "Integrate these concepts into your project workflow and run benchmarks."
        ]

        if "python" in text_to_match or "code" in text_to_match:
            next_steps = [
                "Write a minimal working script to test the solution in an isolated environment.",
                "Add type annotations and unit tests to verify edge cases.",
                "Structure your project modularly following clean code conventions."
            ]
        elif "quantum" in text_to_match:
            next_steps = [
                "Experiment with basic single-qubit quantum circuits using the Qiskit simulator.",
                "Study the Bloch sphere representation of quantum state superpositions.",
                "Run a simple quantum teleportation or Bell state algorithm in Python."
            ]
        elif "pdf" in text_to_match or "document" in text_to_match:
            next_steps = [
                "Review the key takeaways extracted from the document sections.",
                "Ask follow-up questions about specific tables or numerical figures.",
                "Export or summarize the action items for your team."
            ]

        tools = matched_cluster.get("default_tools", [
            {"name": "Python 3", "category": "Development"},
            {"name": "Groq LPU", "category": "AI Acceleration"}
        ])

        resources = matched_cluster.get("resources", [])
        suggested_questions = matched_cluster.get("suggested_questions", [])

        # Build clean summary
        summary = (
            f"Based on your question about **{user_prompt.split('?')[0].strip()[:45]}**, "
            f"it is recommended to dive deeper into the verified resources below and follow the practical next steps."
        )

        return {
            "recommendation": {
                "title": "My recommendation",
                "summary": summary,
                "next_steps": next_steps,
                "tools": tools
            },
            "resources": resources,
            "suggested_questions": suggested_questions
        }

recommendation_service = RecommendationService()
