# Project APAN

Project APAN is a full-stack application that provides an AI-powered timetable negotiation system.

## Tech Stack
- **Frontend:** Next.js, React, Tailwind CSS, Framer Motion, Three.js (React Three Fiber)
- **Backend:** FastAPI, Python, SQLAlchemy
- **AI:** NVIDIA NIM API (Agent Engine)

## Setup

### Frontend
1. Install dependencies: `npm install`
2. Run development server: `npm run dev`

### Backend
1. Install dependencies: `pip install -r requirements.txt`
2. Run development server: `python main.py` or `uvicorn main:app --reload`
3. API runs on `http://127.0.0.1:8000`

### Environment Variables
You need an NVIDIA API key to use the negotiation features. You can pass it as:
- A JSON body parameter `nvidia_api_key` to `/api/negotiate`
- An `X-NVIDIA-API-Key` header
