# Esmeray AI ☪︎ – Production Deployment Guide

This guide provides step-by-step instructions for uploading **Esmeray AI** to **GitHub** and deploying the backend to **Render** and frontend to **Vercel**.

---

## 1. Upload to GitHub

Open a terminal at the project root (`c:\Users\srava\Personal_Projects\AI Powered Conversational Chatbot`):

```bash
# 1. Initialize git repository (if not already initialized)
git init

# 2. Stage all files (respecting .gitignore to never commit secrets or databases)
git add .

# 3. Create initial commit
git commit -m "feat: complete Esmeray AI full stack chatbot (☪︎)"

# 4. Set default branch to main
git branch -M main

# 5. Link your GitHub remote repository
git remote add origin https://github.com/Sravanth-Kumar-Kuricheti/Conversational-Chatbot.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 2. Deploy Backend to Render

Render will host the FastAPI backend with persistent SQLite disk storage.

### Option A: Using Render Blueprint (Fastest)
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Blueprint**.
3. Connect your `Conversational-Chatbot` GitHub repository.
4. Render will automatically detect `backend/render.yaml`.
5. Enter your `GROQ_API_KEY` under the environment variables prompt.
6. Click **Apply**.

### Option B: Manual Web Service Setup
1. On [Render](https://dashboard.render.com), click **New +** -> **Web Service**.
2. Connect your `Conversational-Chatbot` GitHub repository.
3. Configure the following settings:
   - **Name**: `esmeray-ai-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add **Environment Variables**:
   - `GROQ_API_KEY`: *(Your Groq API key: `gsk_...`)*
   - `GROQ_MODEL`: `llama-3.3-70b-versatile`
   - `DEFAULT_MODEL`: `llama-3.3-70b-versatile`
   - `DATABASE_URL`: `sqlite:////var/data/pychat.db`
   - `CORS_ORIGINS`: `*`
5. Add **Persistent Disk** (under Disks section):
   - **Name**: `esmeray-data`
   - **Mount Path**: `/var/data`
   - **Size**: `1 GB`
6. Click **Deploy Web Service**.
7. Once deployed, copy your Render backend URL (e.g., `https://esmeray-ai-backend.onrender.com`).

---

## 3. Deploy Frontend to Vercel

Vercel will host the React + Vite frontend globally with edge performance.

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your `Conversational-Chatbot` GitHub repository.
4. Configure the Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add **Environment Variable**:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://esmeray-ai-backend.onrender.com` *(Paste your actual Render backend URL without a trailing slash)*
6. Click **Deploy**.
7. Once deployed, open your live Vercel URL!
