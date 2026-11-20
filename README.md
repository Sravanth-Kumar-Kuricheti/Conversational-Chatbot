# Esmeray AI ☪︎ – Production Full Stack AI Chatbot

A production-quality, responsive AI chatbot application inspired by the **ChatGPT desktop interface**, built with **FastAPI**, **Groq Python SDK**, **SQLite / SQLAlchemy**, and **React (Vite + Tailwind CSS)**.

**Symbol**: `☪︎`

---

## 🚀 Key Capabilities

- **Exact ChatGPT-Style Dark Architecture**:
  - Sidebar: **260px** (collapsible, and responsive slide-in drawer on mobile).
  - Navbar: **56px** fixed height.
  - Main chat container: **maximum 800px** centered content layout.
  - Colors: `#212121`, `#171717`, `#303030`, `#2A2A2A`, `#414141`, `#10A37F`, `#ECECEC`.
  - Brand Symbol: `☪︎`.
- **Real-Time Token Streaming**: High-throughput SSE token stream with animated typing cursor.
- **Smart Auto-Scroll**: Tracks streaming output with `requestAnimationFrame`, pauses auto-scroll when user scrolls up, and displays a floating jump-to-bottom button.
- **Permanent SQLite History**: All conversation threads, models, and messages persist across browser refreshes and server reboots with full search, inline rename, and delete actions.
- **Multi-Modal Document & Vision Understanding**:
  - Working **`+`** attachment button supporting PDFs (`.pdf`) and images (`.png, .jpg, .jpeg, .webp`).
  - Text extraction and sanitization with `pypdf`.
  - Vision processing with `Pillow` and Groq Multi-Modal Vision API (`qwen/qwen3.8-27b`).
- **"My recommendation" Section**:
  - Contextual recommendation summary.
  - Practical checklist next steps with check icons.
  - Recommended developer tools and frameworks.
- **"This might also interest you" Section**:
  - Verified resource cards with verified documentation links (no hallucinated URLs).
  - Clickable suggested question chips for follow-up prompts.

---

## 📁 Project Structure

```
AI Powered Conversational Chatbot/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, lifespan
│   │   ├── config.py            # Environment configuration & Groq models
│   │   ├── database.py          # SQLAlchemy SQLite engine & sessionmaker
│   │   ├── models/chat.py       # Conversation and Message database models
│   │   ├── schemas/chat.py      # Pydantic v2 schemas for requests & responses
│   │   ├── routes/chat.py       # CRUD endpoints & SSE message streaming
│   │   ├── services/
│   │   │   ├── groq_service.py  # Groq SDK client wrapper & streaming engine
│   │   │   └── recommendation_service.py # Smart recommendations & verified links
│   │   └── utils/helpers.py     # Conversation auto-titler & text sanitizer
│   ├── requirements.txt         # Python dependencies
│   ├── render.yaml              # Render production blueprint
│   ├── .env                     # Environment variables (GROQ_API_KEY)
│   └── test_integration.py     # Automated test suite
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx       # 56px navbar with ☪︎ logo & model selector
    │   │   ├── Sidebar.jsx      # 260px collapsible sidebar with search & rename
    │   │   ├── ChatContainer.jsx# 800px centered container with auto-scroll
    │   │   ├── ChatMessage.jsx  # 85% bubble with ☪︎ avatar, markdown & actions
    │   │   ├── ChatComposer.jsx # 56-180px composer with working + attachment
    │   │   ├── WelcomeScreen.jsx# "How can I help you today?" with ☪︎ logo
    │   │   ├── RecommendationSection.jsx # "My recommendation" & resource cards
    │   │   ├── CodeBlock.jsx    # Syntax highlighter with copy action
    │   │   ├── SettingsModal.jsx# Groq status & model settings dialog
    │   │   └── AboutModal.jsx   # App architecture modal
    │   ├── context/ChatContext.jsx  # Global state provider
    │   ├── hooks/useAutoScroll.js   # Smart scrolling hook
    │   ├── services/api.js          # Fetch API & SSE stream consumer
    │   ├── pages/ChatPage.jsx       # Main layout page
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css            # Tailwind directives & dark theme styling
    ├── index.html               # ☪︎ favicon & title
    ├── package.json             # esmeray-ai-frontend
    ├── tailwind.config.js       # Exact color palette & dimensions
    └── vite.config.js           # Vite dev proxy configuration
```

---

## 🛠️ Local Development

### 1. Configure Backend Environment
Edit `backend/.env`:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
DEFAULT_MODEL=llama-3.3-70b-versatile
DATABASE_URL=sqlite:///./pychat.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

### 2. Run Backend (FastAPI)
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Run Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser.
