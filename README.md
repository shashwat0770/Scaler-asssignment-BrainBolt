# BrainBolt – Adaptive Infinite Quiz Platform

An adaptive infinite quiz platform that serves one question at a time. Difficulty increases after correct answers and decreases after wrong answers using a momentum-based algorithm.

## 🚀 Quick Start (Single Command)

```bash
docker-compose up --build
```

This starts **all services**:
- **Frontend**: http://localhost:3000 (Next.js)
- **Backend API**: http://localhost:5000 (Express)
- **Redis**: localhost:6379 (caching)
- **MongoDB**: Atlas cloud (pre-configured)

## 🏗️ Architecture

```
Frontend (Next.js 14) → Backend API (Express/TypeScript) → MongoDB Atlas
                                    ↓
                              Redis Cache
                                    ↓
                              SSE (real-time leaderboards)
```

## 📁 Project Structure

```
├── frontend/               # Next.js 14 App Router + TypeScript
│   ├── src/
│   │   ├── app/            # Pages (login, quiz, leaderboard, metrics)
│   │   ├── components/     # Reusable component library
│   │   └── lib/            # API layer, types, auth context
│   └── Dockerfile
├── backend/                # Express + TypeScript
│   ├── src/
│   │   ├── models/         # Mongoose models (6)
│   │   ├── services/       # Business logic (6)
│   │   ├── routes/         # API routes (3)
│   │   ├── middleware/     # Rate limiting, error handling
│   │   └── seed/           # 100+ seed questions across 10 levels
│   └── Dockerfile
├── docker-compose.yml      # Full stack orchestration
├── LLD.md                  # Low-Level Design document
└── README.md
```

## ✨ Features

- **Adaptive Difficulty**: Momentum-based algorithm with ping-pong stabilization
- **Streak System**: Streak multiplier (capped at 3x) affects scoring
- **Live Leaderboards**: Real-time via Server-Sent Events (SSE)
- **User Metrics**: Accuracy, difficulty histogram, recent performance window
- **Dark/Light Theme**: Toggle with persistence
- **Responsive Design**: Mobile-first, works on all screen sizes
- **Idempotent Answers**: Duplicate submissions handled via idempotency keys
- **Rate Limiting**: Prevents abuse (100 req/min global, 5 answers/10s)
- **Redis Caching**: User state, question pools, leaderboards (with graceful fallback)

## 🧪 Local Development (Without Docker)

### Backend
```bash
cd backend
npm install
npm run dev        # Starts on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # Starts on port 3000
```

### Environment Variables

**Backend** (`.env`):
```
PORT=5000
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`.env`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/user/register` | Register/login user |
| GET | `/v1/quiz/next` | Get next adaptive question |
| POST | `/v1/quiz/answer` | Submit answer (idempotent) |
| GET | `/v1/quiz/metrics` | Get user performance metrics |
| GET | `/v1/leaderboard/score` | Top scores leaderboard |
| GET | `/v1/leaderboard/streak` | Top streaks leaderboard |
| GET | `/v1/leaderboard/stream` | SSE real-time updates |

## 🧠 Adaptive Algorithm

Uses **momentum-based difficulty adjustment** with:
- Exponential decay (factor: 0.7)
- Threshold band (±0.6) — prevents ping-pong oscillation
- Minimum streak (≥2) required to increase difficulty
- Momentum cap (±2.0)

See [LLD.md](./LLD.md) for detailed pseudocode and edge case handling.

## 📄 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript, CSS Modules |
| Backend | Express, TypeScript, Mongoose |
| Database | MongoDB Atlas |
| Cache | Redis |
| Real-time | Server-Sent Events (SSE) |
| Containerization | Docker, Docker Compose |
