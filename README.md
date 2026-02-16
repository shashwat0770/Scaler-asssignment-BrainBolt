[# BrainBolt – Adaptive Infinite Quiz Platform]

An adaptive infinite quiz platform that serves one question at a time. Difficulty increases after correct answers and decreases after wrong answers using a momentum-based algorithm.

<br>
<br>


<h1>Below I have put the demo video explanation of this project Scaler Assignment- BrainBolt , complete frontend , backend and database connectivity</h1>

<h1><b>Video link :-</b></h1>

<h1>https://drive.google.com/file/d/1kxIKqqn6PP3SoGGSVOlJxOelTP0xpUJG/view?usp=drivesdk</h1>

<br>
<br>

<h1>📸 Screenshots</h1>
🏠 Login / Registration Page

Add screenshot here
![Login Page]
1.<img width="1919" height="1017" alt="Screenshot 2026-02-16 225641" src="https://github.com/user-attachments/assets/e8577c59-456e-45ee-a4b8-04bf36b23849" />

<br>
<br>
<br>
2.<img width="1919" height="1017" alt="Screenshot 2026-02-16 225932" src="https://github.com/user-attachments/assets/78630f36-d7c3-458f-be77-55854c2d669c" />
<br>
<br>
<br>


🧠 Quiz Interface (Adaptive Question View)

Add screenshot here
3.<img width="1919" height="1019" alt="Screenshot 2026-02-16 225938" src="https://github.com/user-attachments/assets/0597ce76-96df-48c9-be8a-f06eed04b315" />

<br>
<br>
<br>
4.<img width="1919" height="1016" alt="Screenshot 2026-02-16 225951" src="https://github.com/user-attachments/assets/754b951a-4248-446d-b856-e8eefe537cfa" />
<br>
<br>
<br>
5.<img width="1919" height="1020" alt="Screenshot 2026-02-16 225959" src="https://github.com/user-attachments/assets/5ae26df4-de3c-4ff5-99e6-442f34d8fc49" />

<br>
<br>
<br>

6.<img width="1919" height="1024" alt="Screenshot 2026-02-16 230006" src="https://github.com/user-attachments/assets/7904e2bd-bb86-4388-8216-7fbd13cf06b6" />

<br>
<br>
<br>

7.<img width="1919" height="1014" alt="Screenshot 2026-02-16 230030" src="https://github.com/user-attachments/assets/b83731df-7824-4294-a1c5-49bee0aec3fc" />

📊 User Metrics Dashboard

Add screenshot here
![Metrics Dashboard](./screenshots/metrics.png)

🏆 Live Leaderboard (SSE)

Add screenshot here
![Leaderboard](./screenshots/leaderboard.png)





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
](https://github.com/shashwat0770/Scaler-asssignment-2.git)
