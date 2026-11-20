import os
import io
import re
import base64
import asyncio
from pathlib import Path
from typing import AsyncGenerator, List, Dict, Any, Tuple
from dotenv import load_dotenv
from groq import Groq, GroqError
import pypdf
from PIL import Image

from app.config import settings

def sanitize_pdf_text(text: str) -> str:
    """Remove null bytes, binary escapes, and control characters from extracted PDF text."""
    if not text:
        return ""
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    return cleaned.strip()

class GroqService:
    def __init__(self):
        self._env_path = Path(__file__).resolve().parent.parent.parent / ".env"
        self._api_key = ""
        self._client: Groq | None = None
        self._check_reload()

    def _check_reload(self):
        """Reload .env file to pick up any changes dynamically."""
        if self._env_path.exists():
            load_dotenv(dotenv_path=self._env_path, override=True)
        new_key = os.getenv("GROQ_API_KEY", "").strip()
        if new_key != self._api_key or self._client is None:
            self._api_key = new_key
            if new_key:
                try:
                    self._client = Groq(api_key=new_key)
                except Exception as e:
                    print(f"[GroqService] Client init error: {e}")
                    self._client = None
            else:
                self._client = None

    @property
    def is_configured(self) -> bool:
        self._check_reload()
        return bool(self._api_key and self._client is not None)

    def get_models(self) -> List[Dict[str, Any]]:
        self._check_reload()
        return settings.AVAILABLE_MODELS

    def process_attachment(self, attachment: Dict[str, Any], prompt: str) -> Tuple[str, Any]:
        """
        Processes attached PDF or image:
        - If PDF: extracts text with pypdf, sanitizes characters, and adds document context.
        - If Image: validates with Pillow, ensures minimum dimensions >= 32px,
          and formats multimodal image_url content for Groq Vision.
        """
        filename = attachment.get("name", "file")
        mime_type = attachment.get("type", "").lower()
        data_str = attachment.get("data", "")

        # Extract raw base64 data
        if "," in data_str:
            b64_clean = data_str.split(",", 1)[1]
            header = data_str.split(",", 1)[0]
        else:
            b64_clean = data_str
            header = f"data:{mime_type};base64"

        try:
            raw_bytes = base64.b64decode(b64_clean)
        except Exception as e:
            print(f"[GroqService] Base64 decode error: {e}")
            return prompt, None

        # Handle PDF
        if "pdf" in mime_type or filename.lower().endswith(".pdf"):
            try:
                reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
                total_pages = len(reader.pages)
                pages_text = []

                # Extract up to 10 pages to stay safely within token ceilings
                max_pages = min(total_pages, 10)
                for i in range(max_pages):
                    page = reader.pages[i]
                    extracted = page.extract_text()
                    if extracted and extracted.strip():
                        sanitized = sanitize_pdf_text(extracted)
                        pages_text.append(f"--- Page {i + 1} ---\n{sanitized}")

                full_text = "\n\n".join(pages_text) if pages_text else "[No text extractable from this PDF]"
                
                # Keep up to 8,000 characters (~2,000 tokens)
                if len(full_text) > 8000:
                    full_text = full_text[:8000] + f"\n\n... [Extracted first {max_pages} pages, truncated for length]"

                user_prompt = prompt.strip() if prompt.strip() else "Please summarize and analyze this attached document."
                enhanced_prompt = (
                    f"📄 **Attached Document:** `{filename}` ({total_pages} page(s))\n\n"
                    f"```text\n{full_text}\n```\n\n"
                    f"**User Request:** {user_prompt}"
                )
                return enhanced_prompt, None
            except Exception as e:
                print(f"[GroqService] PDF processing error: {e}")
                return f"📄 Attached document: `{filename}` (Note: could not parse PDF text: {e})\n\n{prompt}", None

        # Handle Image (PNG, JPG, JPEG, WEBP)
        if any(img_t in mime_type for img_t in ["image", "png", "jpeg", "jpg", "webp"]) or any(
            filename.lower().endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp"]
        ):
            try:
                img = Image.open(io.BytesIO(raw_bytes))
                w, h = img.size

                # Groq vision requires at least 32 pixels in each dimension
                if w < 32 or h < 32:
                    new_w = max(w, 32)
                    new_h = max(h, 32)
                    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                    buf = io.BytesIO()
                    img.save(buf, format="JPEG")
                    raw_bytes = buf.getvalue()
                    b64_clean = base64.b64encode(raw_bytes).decode("utf-8")
                    data_url = f"data:image/jpeg;base64,{b64_clean}"
                else:
                    data_url = f"{header},{b64_clean}" if "," in data_str else f"data:{mime_type};base64,{b64_clean}"

                user_prompt = prompt.strip() if prompt.strip() else "Please analyze this image and explain what you see in detail."
                multimodal_content = [
                    {"type": "text", "text": user_prompt},
                    {"type": "image_url", "image_url": {"url": data_url}}
                ]
                text_summary = f"🖼️ **Attached Image:** `{filename}` ({w}×{h}px)\n\n{user_prompt}"
                return text_summary, multimodal_content
            except Exception as e:
                print(f"[GroqService] Image processing error: {e}")
                return f"🖼️ Attached image: `{filename}` (Error: {e})\n\n{prompt}", None

        return prompt, None

    def prepare_messages(self, history: List[Dict[str, Any]], max_chars: int = 14000) -> List[Dict[str, Any]]:
        """
        Cleans and manages conversation history with a sliding window so follow-up
        questions on large PDFs never exceed the model's context or token limits.
        """
        messages = [{"role": "system", "content": settings.SYSTEM_PROMPT}]
        valid_history = []

        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("content")
            if role in ["user", "assistant", "system"] and content:
                valid_history.append({"role": role, "content": content})

        if not valid_history:
            return messages

        # Check total character length across conversation
        total_len = sum(len(str(m.get("content", ""))) for m in valid_history)

        if total_len <= max_chars or len(valid_history) <= 3:
            messages.extend(valid_history)
            return messages

        # Sliding window: Always keep the first turn (often contains the PDF context)
        first_msg = valid_history[0]
        recent_msgs = valid_history[-3:] # Last 3 turns

        if first_msg not in recent_msgs:
            messages.append(first_msg)

        for m in recent_msgs:
            if m not in messages:
                messages.append(m)

        return messages

    async def stream_completion(
        self,
        messages: List[Dict[str, Any]],
        model: str = "llama-3.3-70b-versatile",
        has_image: bool = False
    ) -> AsyncGenerator[str, None]:
        self._check_reload()

        if not self.is_configured:
            demo_text = (
                "👋 **Welcome to PyChat AI!**\n\n"
                "Please configure your `GROQ_API_KEY` in `backend/.env`.\n"
                "Once configured, real-time completions and vision will stream live!"
            )
            for word in demo_text.split(" "):
                yield word + " "
                await asyncio.sleep(0.02)
            return

        formatted_messages = self.prepare_messages(messages)
        loop = asyncio.get_running_loop()

        active_model = model or settings.DEFAULT_MODEL
        # If an image is attached, force vision model qwen/qwen3.8-27b
        if has_image:
            active_model = "qwen/qwen3.8-27b"
        elif "canopylabs" in active_model or "orpheus" in active_model:
            active_model = "qwen/qwen3.8-27b"

        # On-demand free tier enforces OTPM limit of 1,000 tokens
        # Setting max_tokens=900 guarantees zero OTPM rate limit errors!
        def run_groq_stream(target_model: str, msgs: List[Dict[str, Any]], max_tok: int = 900):
            return self._client.chat.completions.create(
                model=target_model,
                messages=msgs,
                stream=True,
                temperature=0.7,
                max_tokens=max_tok
            )

        stream = None
        try:
            stream = await loop.run_in_executor(None, lambda: run_groq_stream(active_model, formatted_messages, 900))
        except GroqError as e:
            err_str = str(e)
            
            # 1. If context length exceeded or 429 request too large / OTPM:
            if "reduce the length" in err_str.lower() or "too large" in err_str.lower() or "rate_limit_exceeded" in err_str or "429" in err_str:
                print(f"[GroqService] Request too large or rate limit for {active_model}, retrying with trimmed context and max_tokens=500...")
                trimmed_msgs = [formatted_messages[0], formatted_messages[-1]]
                try:
                    stream = await loop.run_in_executor(None, lambda: run_groq_stream("qwen/qwen3.8-27b", trimmed_msgs, 500))
                except Exception as trim_err:
                    yield f"\n\n⚠️ **Context Limit Error**: {str(trim_err)}"
                    return

            # 2. If model not found, access restricted (70B), terms required, or decommissioned:
            elif any(x in err_str for x in ["model_not_found", "access", "model_decommissioned", "model_terms_required"]):
                print(f"[GroqService] Model {active_model} unavailable, auto-fallback to qwen/qwen3.8-27b...")
                try:
                    fallback_model = "qwen/qwen3.8-27b"
                    stream = await loop.run_in_executor(None, lambda: run_groq_stream(fallback_model, formatted_messages, 900))
                except Exception as fallback_err:
                    yield f"\n\n⚠️ **Groq API Error**: {str(fallback_err)}"
                    return
            else:
                yield f"\n\n⚠️ **Groq API Error**: {err_str}"
                return
        except Exception as e:
            yield f"\n\n⚠️ **Unexpected Error**: {str(e)}"
            return

        # Stream chunks to SSE
        try:
            for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta and delta.content:
                        yield delta.content
                        await asyncio.sleep(0.001)
        except Exception as e:
            yield f"\n\n⚠️ **Stream interrupted**: {str(e)}"

groq_service = GroqService()
