# InterviewSense AI 🎙️

> AI-powered mock interview platform with voice input, Gemini-powered evaluation, and detailed analytics.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS 3 |
| Backend | Flask (Python) |
| AI | Google Gemini 1.5 Pro |
| Auth + DB | Firebase Auth + Firestore |
| Deployment | Vercel (frontend) + Render (backend) |

## Project Structure

```
ai-mock-interviewer/
├── frontend/              # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/    # Shared UI components
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Interview.jsx
│   │   │   └── Report.jsx
│   │   ├── firebase.js    # Firebase config
│   │   ├── App.jsx        # Router setup
│   │   └── index.css      # Global styles + design system
│   ├── .env.example       # Frontend env vars template
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/               # Flask API
│   ├── app.py             # App factory
│   ├── routes/
│   │   ├── interview.py   # /api/interview/*
│   │   └── report.py      # /api/report/*
│   ├── prompts/
│   │   └── templates.py   # Gemini prompt templates
│   ├── .env.example       # Backend env vars template
│   └── requirements.txt
└── .gitignore
```

## Quick Start

### 1. Clone and set up

```bash
git clone <your-repo-url>
cd ai-mock-interviewer
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env     # Fill in your Firebase config
npm run dev              # Runs on http://localhost:3000
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate    # Windows
pip install -r requirements.txt
cp .env.example .env     # Fill in your Gemini + Firebase keys
python app.py            # Runs on http://localhost:5000
```

### 4. Environment Variables

**Frontend** (`.env`): Firebase Web SDK config — see `.env.example`

**Backend** (`.env`): Gemini API key + Firebase Admin SDK — see `.env.example`

## Features (Build Progress)

- [x] Step 1: Project setup + folder structure
- [x] Step 2: Landing page (premium dark mode)
- [ ] Step 3: Auth + Dashboard
- [ ] Step 4: Interview Engine (Voice + Gemini)
- [ ] Step 5: Post-interview Report + Resume upload
- [ ] Step 6: Streak system + Shareable cards
- [ ] Step 7: Deployment (Vercel + Render)

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/interview/start` | Start a new interview session |
| POST | `/api/interview/next` | Evaluate answer + get next question |
| POST | `/api/interview/end` | End session |
| POST | `/api/interview/resume` | Upload resume for personalized Qs |
| POST | `/api/report/generate` | Generate full report |
| GET | `/api/report/:id` | Fetch a report |
| GET | `/api/report/history/:uid` | User's interview history |
