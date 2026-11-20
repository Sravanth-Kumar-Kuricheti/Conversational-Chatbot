import re

def sanitize_text(text: str) -> str:
    """
    Sanitize text input by stripping control characters and excessive trailing whitespace.
    """
    if not text:
        return ""
    # Remove null bytes and non-printable control characters except newline and tab
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    return cleaned.strip()

def generate_title_from_text(text: str, max_words: int = 6, max_chars: int = 36) -> str:
    """
    Generate a clean ChatGPT-style conversation title based on the first user message.
    """
    cleaned = sanitize_text(text)
    # Remove markdown symbols, special punct at beginning
    cleaned = re.sub(r'^[#>\-\*\s]+', '', cleaned)
    # Get first sentence or line
    first_line = cleaned.split('\n')[0].strip()
    # Strip common leading question words for a cleaner topic title
    first_line = re.sub(r'^(please\s+|can\s+you\s+|how\s+do\s+i\s+|what\s+is\s+|tell\s+me\s+about\s+)', '', first_line, flags=re.IGNORECASE)
    
    words = first_line.split()
    if not words:
        return "New Chat"
    
    title = " ".join(words[:max_words])
    if len(title) > max_chars:
        title = title[:max_chars].rstrip() + "..."
    elif len(words) > max_words:
        title = title + "..."
        
    return title.capitalize()
