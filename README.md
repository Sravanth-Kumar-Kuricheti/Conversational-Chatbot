# PyChat AI – Full Stack AI Chatbot (Phases 1–4)

A production-quality, responsive AI chatbot application inspired by the **ChatGPT desktop interface**, built with **FastAPI**, **Groq Python SDK**, **SQLite / SQLAlchemy**, and **React (Vite + Tailwind CSS)**.

---

## 🚀 Features Implemented (Phases 1–4)

### Phase 1: ChatGPT-Style UI and Exact Dimensions
- **Exact Desktop Reference Viewport (1440 × 900)**:
  - Sidebar: **260px** (collapsible, and responsive slide-in drawer on mobile).
  - Navbar: **56px** fixed height.
  - Main chat container: **maximum 800px** centered content layout.
  - Chat horizontal padding: **24px** (desktop/tablet) and **14px** (mobile).
  - User message maximum width: **85%**.
  - Input composer: **min 56px**, **max 180px**, border radius **24px**.
  - Message spacing: **24px**.
  - Assistant Avatar: **32px** with PyChat emerald styling (`#10A37F`).
- **Exact Color Palette**:
  - Main background: `#212121`
  - Sidebar: `#171717`
  - Input background: `#303030`
  - Cards & User Bubbles: `#2A2A2A`
  - Borders: `#414141`
  - Accent: `#10A37F` (ChatGPT green)
  - Primary text: `#ECECEC`
  - Secondary text: `#8E8EA0`
- **Centered Welcome Screen**: "How can I help you today?" with 4 interactive prompt suggestion cards.
- **Code & Markdown Rendering**:
  - Markdown tables, lists, blockquotes, and links.
  - Syntax highlighted code blocks with language badges.
  - One-click **Copy Code** with animated "Copied!" feedback.
  - **Copy Response** and **Retry Response** actions.

### Phase 2: FastAPI + Groq AI Integration
- **FastAPI backend** running asynchronous Server-Sent Events (SSE).
- **Groq Python SDK** integration with conversation context history retention.
- **Configurable Models**:
  - `llama-3.3-70b-versatile` (Default, SOTA reasoning & coding)
  - `llama-3.1-8b-instant` (Ultra-fast latency)
  - `mixtral-8x7b-32768` (High-throughput MoE)
  - `gemma2-9b-it` (Google open model)
- Secure environment configuration via `.env` (`GROQ_API_KEY`).
- Graceful error handling and interactive fallback stream when key is not yet set.

### Phase 3: Streaming and Smart Auto-Scroll
- Real-time token-by-token streaming via SSE (`text/event-stream`).
- Visual blinking typing cursor (`▋`).
- Smart auto-scrolling hook (`useAutoScroll`):
  - Automatically follows streaming AI tokens using `requestAnimationFrame`.
  - **Manual scroll-up detection**: Pauses auto-scrolling immediately if the user scrolls up to read earlier messages.
  - **Floating Scroll-To-Bottom button** appears when user has scrolled up.
  - Automatically resumes following when the user scrolls back to the bottom.

### Phase 4: Permanent SQLite Chat History
- **SQLite Database with SQLAlchemy ORM**:
  - `conversations` table: `id`, `title`, `model`, `created_at`, `updated_at`.
  - `messages` table: `id`, `conversation_id` (foreign key with cascade delete), `role`, `content`, `created_at`.
- **Automatic Conversation Titling**: Automatically generates clean ChatGPT-style titles from the first user prompt.
- **Permanent Persistence**: Chat history persists across browser refreshes and backend restarts.
- **Real-Time Search**: Search through conversation titles and message content instantly.
- **Inline Rename & Delete**: Rename conversations directly in the sidebar or permanently delete them with confirmation.

---

## 📁 Project Architecture

```
AI Powered Conversational Chatbot/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app, CORS, SQLite lifespan
│   │   ├── config.py            # Environment configuration & models list
│   │   ├── database.py          # SQLAlchemy SQLite engine & sessionmaker
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── chat.py          # Conversation and Message SQLAlchemy models
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── chat.py          # Pydantic v2 schemas for requests & responses
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   └── chat.py          # CRUD endpoints & SSE message streaming
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── groq_service.py  # Groq SDK client wrapper & streaming engine
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── helpers.py       # Title generation & text sanitizer
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables (GROQ_API_KEY)
│   └── test_integration.py     # End-to-end automated test suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # 56px fixed navbar with model selector & new chat
│   │   │   ├── Sidebar.jsx      # 260px collapsible sidebar, search, rename, delete
│   │   │   ├── ChatContainer.jsx# 800px centered container with auto-scroll
│   │   │   ├── ChatMessage.jsx  # 85% user bubble & assistant markdown/actions
│   │   │   ├── ChatComposer.jsx # 56-180px auto-resizing composer (24px radius)
│   │   │   ├── WelcomeScreen.jsx# "How can I help you today?" prompt cards
│   │   │   ├── CodeBlock.jsx    # Syntax highlighter with copy action
│   │   │   ├── SettingsModal.jsx# Groq status & model settings dialog
│   │   │   └── AboutModal.jsx   # App architecture modal
│   │   ├── context/
│   │   │   └── ChatContext.jsx  # Global state provider
│   │   ├── hooks/
│   │   │   └── useAutoScroll.js # ChatGPT-style smart scrolling hook
│   │   ├── services/
│   │   │   └── api.js           # Fetch API & SSE stream consumer
│   │   ├── pages/
│   │   │   └── ChatPage.jsx     # Main layout page
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css            # Tailwind directives & dark theme styling
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js       # Exact color palette and dimensions
│   ├── postcss.config.js
│   └── vite.config.js           # Vite dev proxy configuration
└── README.md
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Python 3.10+** (Python 3.13 or 3.14 verified)
- **Node.js 18+** and **npm**

---

### 2. Configure Environment Variables
Open `backend/.env` and insert your free **Groq API key**:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
DEFAULT_MODEL=llama-3.3-70b-versatile
DATABASE_URL=sqlite:///./pychat.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```
*(You can get a free Groq API key in 30 seconds at [console.groq.com/keys](https://console.groq.com/keys)).*

---

### 3. Run Backend (FastAPI)

```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will start at `http://127.0.0.1:8000`.
- API documentation: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

---

### 4. Run Frontend (React + Vite)

In a new terminal window:

```bash
cd frontend
npm run dev
```
Open your browser and navigate to:
**`http://localhost:5173`**

---

## 🧪 Testing

To run the automated backend and integration test suite:

```bash
cd backend
python test_integration.py
```
This tests:
1. Health endpoint (`GET /api/health`)
2. Model listing (`GET /api/models`)
3. Conversation creation (`POST /api/conversations`)
4. SSE Token streaming (`POST /api/conversations/{id}/messages`)
5. Permanent SQLite message persistence
6. Full-text conversation & message search
7. Conversation renaming
8. Conversation cascading deletion
