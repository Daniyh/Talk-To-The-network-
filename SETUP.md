# RAN Dashboard Backend — Setup Guide

## Prerequisites
- Python 3.10+
- A free Groq API key → https://console.groq.com

---

## Local Development

```bash
# 1. Enter the backend folder
cd ran-dashboard-backend

# 2. Create and activate a virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy and fill in your .env
cp .env.example .env
# Edit .env and set GROQ_API_KEY=gsk_...

# 5. Download the 6G HetNet dataset (one-time)
python download_dataset.py

# 6. Start the server
python server.py
# Server runs at http://localhost:8000
# Test: http://localhost:8000/health
```

---

## Railway Deployment

1. Push this folder to a GitHub repo (or connect Railway to your existing repo)
2. In Railway dashboard → **New Project** → **Deploy from GitHub repo**
3. Set the **Root Directory** to `ran-dashboard-backend/` (if it's inside a monorepo)
4. Add environment variable: `GROQ_API_KEY = gsk_your_key_here`
5. Railway auto-detects `Procfile` and deploys with gunicorn

**After deploy**, copy the Railway service URL (e.g. `https://ran-backend-production.up.railway.app`)
and set it in your Vercel frontend:
```
NEXT_PUBLIC_BACKEND_URL=https://ran-backend-production.up.railway.app
```

---

## Architecture

```
User types: "prepare for 50,000 stadium fans"
           │
           ▼
     Flask /api/intent (POST)
           │
           ▼
    ┌──────────────────────────────────────────┐
    │          CrewAI Sequential Crew           │
    │                                          │
    │  Agent 1: Intent Parser                  │
    │  → Parses NL into structured intent JSON │
    │           │                              │
    │  Agent 2: RAN Planner                    │
    │  → Generates 3GPP R18 config JSON        │
    │           │                              │
    │  Agent 3: Network Monitor                │
    │  → Reads CSV, checks KPI thresholds      │
    │           │                              │
    │  Agent 4: RAN Optimizer                  │
    │  → Picks best action, measures before/after│
    └──────────────────────────────────────────┘
           │
           ▼
    JSON response to Vercel frontend
    { intent, config, monitor, optimization }
```

All agents use **Groq Llama 3.3 70B** via CrewAI's LiteLLM adapter.
If the LLM fails, a rule-based fallback returns immediately.

---

## Files

| File | Purpose |
|------|---------|
| `server.py` | Flask app, CORS, routing |
| `ran_crew.py` | CrewAI agents + tasks + pipeline |
| `csv_tool.py` | Custom tool reading the 6G HetNet CSV |
| `fallbacks.py` | Rule-based fallback responses |
| `download_dataset.py` | One-time CSV downloader |
| `Procfile` | gunicorn start command for Railway |
| `railway.toml` | Railway deploy config |
