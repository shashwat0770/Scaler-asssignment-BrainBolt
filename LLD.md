# BrainBolt – Low-Level Design (LLD)

## 1. System Architecture Overview

```
┌─────────────┐    HTTP     ┌──────────────┐    Mongoose    ┌──────────┐
│   Next.js   │◄──────────►│  Express API  │◄────────────►│ MongoDB  │
│  Frontend   │    SSE      │   (Node.js)   │               │ Atlas    │
│  Port 3000  │◄────────── │   Port 5000   │◄──────────┐   └──────────┘
└─────────────┘             └──────────────┘            │
                                    │                    │
                                    ▼                ┌───────┐
                              ┌───────────┐          │ Redis │
                              │ Rate      │          │ Cache │
                              │ Limiter   │          └───────┘
                              └───────────┘
```

## 2. Module Responsibilities

| Module | File | Responsibility |
|--------|------|---------------|
| **Config** | `config.ts` | Centralized configuration constants (difficulty bounds, scoring params, cache TTLs) |
| **Database** | `db.ts` | MongoDB connection management |
| **Redis** | `redis.ts` | Redis connection with graceful fallback; `cacheGet`, `cacheSet`, `cacheDel` |
| **Adaptive Engine** | `services/adaptiveEngine.ts` | Momentum-based difficulty adjustment, streak decay, rolling window |
| **Score Service** | `services/scoreService.ts` | Score calculation with difficulty weight × streak multiplier |
| **Quiz Service** | `services/quizService.ts` | Orchestrates next question selection, answer processing, state updates |
| **Leaderboard Service** | `services/leaderboardService.ts` | Leaderboard CRUD, rank calculation, SSE broadcasts |
| **Cache Service** | `services/cacheService.ts` | High-level caching for questions, user state, leaderboards |
| **SSE Manager** | `services/sseManager.ts` | Server-Sent Events for real-time leaderboard updates |

## 3. API Schemas

### POST /v1/user/register
```json
// Request
{ "username": "string (1-30 chars)" }
// Response
{ "userId": "ObjectId", "username": "string", "createdAt": "ISO 8601" }
```

### GET /v1/quiz/next?userId={id}
```json
// Response
{
  "questionId": "ObjectId",
  "difficulty": 1-10,
  "prompt": "string",
  "choices": ["A", "B", "C", "D"],
  "sessionId": "userId",
  "stateVersion": "number",
  "currentScore": "number",
  "currentStreak": "number",
  "maxStreak": "number",
  "currentDifficulty": 1-10,
  "momentum": "number"
}
```

### POST /v1/quiz/answer
```json
// Request
{
  "userId": "ObjectId",
  "questionId": "ObjectId",
  "answer": "string",
  "stateVersion": "number",
  "answerIdempotencyKey": "unique string"
}
// Response
{
  "correct": "boolean",
  "correctAnswer": "string",
  "newDifficulty": 1-10,
  "newStreak": "number",
  "maxStreak": "number",
  "scoreDelta": "number",
  "totalScore": "number",
  "stateVersion": "number",
  "leaderboardRankScore": "number",
  "leaderboardRankStreak": "number",
  "streakMultiplier": "number",
  "difficultyWeight": "number",
  "momentum": "number"
}
```

### GET /v1/quiz/metrics?userId={id}
```json
// Response
{
  "currentDifficulty": 1-10,
  "streak": "number",
  "maxStreak": "number",
  "totalScore": "number",
  "accuracy": 0.0-1.0,
  "totalAnswered": "number",
  "totalCorrect": "number",
  "recentPerformance": 0.0-1.0,
  "momentum": "number",
  "difficultyHistogram": { "1": 10, "2": 15, ... }
}
```

### GET /v1/leaderboard/score?userId={id}
### GET /v1/leaderboard/streak?userId={id}
```json
// Response
{
  "leaderboard": [
    { "rank": 1, "userId": "id", "username": "name", "value": 1000, "isCurrentUser": false }
  ],
  "userRank": { "rank": 15, "userId": "id", "username": "name", "value": 200, "isCurrentUser": true }
}
```

### GET /v1/leaderboard/stream?clientId={id}
SSE stream. Events: `leaderboard_score`, `leaderboard_streak`

## 4. Database Schema with Indexes

### users
| Field | Type | Constraints |
|-------|------|-------------|
| _id | ObjectId | PK |
| username | String | unique, required, 1-30 chars |
| createdAt | Date | default: now |
**Indexes:** `{ username: 1 }` unique

### questions
| Field | Type | Constraints |
|-------|------|-------------|
| _id | ObjectId | PK |
| difficulty | Number | 1-10, required |
| prompt | String | required |
| choices | [String] | required |
| correctAnswer | String | required |
| correctAnswerHash | String | required (SHA-256) |
| tags | [String] | default: [] |
**Indexes:** `{ difficulty: 1 }`, `{ tags: 1 }`

### user_state
| Field | Type | Constraints |
|-------|------|-------------|
| _id | ObjectId | PK |
| userId | ObjectId → users | unique, required |
| currentDifficulty | Number | default: 1, 1-10 |
| streak | Number | default: 0 |
| maxStreak | Number | default: 0 |
| totalScore | Number | default: 0 |
| totalAnswered | Number | default: 0 |
| totalCorrect | Number | default: 0 |
| lastQuestionId | ObjectId → questions | nullable |
| lastAnswerAt | Date | nullable |
| stateVersion | Number | default: 0 (optimistic concurrency) |
| momentum | Number | default: 0 |
| recentAnswers | [Boolean] | default: [], rolling window |
**Indexes:** `{ userId: 1 }` unique

### answer_log
| Field | Type | Constraints |
|-------|------|-------------|
| _id | ObjectId | PK |
| userId | ObjectId → users | required |
| questionId | ObjectId → questions | required |
| difficulty | Number | required |
| answer | String | required |
| correct | Boolean | required |
| scoreDelta | Number | required |
| streakAtAnswer | Number | required |
| answeredAt | Date | default: now |
| idempotencyKey | String | unique, required |
**Indexes:** `{ userId: 1, answeredAt: -1 }`, `{ idempotencyKey: 1 }` unique

### leaderboard_score
| Field | Type | Constraints |
|-------|------|-------------|
| userId | ObjectId → users | unique, required |
| username | String | required |
| totalScore | Number | default: 0 |
| updatedAt | Date | default: now |
**Indexes:** `{ totalScore: -1 }`, `{ userId: 1 }` unique

### leaderboard_streak
| Field | Type | Constraints |
|-------|------|-------------|
| userId | ObjectId → users | unique, required |
| username | String | required |
| maxStreak | Number | default: 0 |
| updatedAt | Date | default: now |
**Indexes:** `{ maxStreak: -1 }`, `{ userId: 1 }` unique

## 5. Cache Strategy

| Cache Key | Data | TTL | Invalidation |
|-----------|------|-----|-------------|
| `user_state:{userId}` | Full user state JSON | 300s | On every answer submission |
| `questions:difficulty:{n}` | Question pool array | 600s | Manual/on reseed |
| `leaderboard:score` | Top N scores | 10s | On every answer (broadcast) |
| `leaderboard:streak` | Top N streaks | 10s | On every answer (broadcast) |

**Invalidation Strategy:**
- User state cache invalidated immediately after each answer submission via `cacheDel`
- Leaderboard caches invalidated after each leaderboard update
- Question pools only change on reseed (10min TTL is safe)
- Redis failures are handled gracefully — app falls back to MongoDB reads

## 6. Adaptive Algorithm Pseudocode

```
function calculateNewDifficulty(currentDifficulty, isCorrect, momentum, streak):
    // Step 1: Update momentum with exponential decay
    if isCorrect:
        newMomentum = momentum * 0.7 + 1.0
    else:
        newMomentum = momentum * 0.7 - 1.0

    // Step 2: Clamp to [-2.0, +2.0]
    newMomentum = clamp(newMomentum, -2.0, 2.0)

    // Step 3: Apply hysteresis — only change difficulty if momentum exceeds threshold
    newDifficulty = currentDifficulty
    
    if newMomentum > 0.6 AND streak >= 2:
        newDifficulty = min(currentDifficulty + 1, 10)    // Increase
    else if newMomentum < -0.6:
        newDifficulty = max(currentDifficulty - 1, 1)     // Decrease
    // else: STAY (stabilized in hysteresis band)

    return { newDifficulty, newMomentum }
```

**Ping-pong prevention mechanisms:**
1. **Momentum decay (0.7):** Alternating correct/wrong → momentum oscillates near 0, never exceeds ±0.6
2. **Threshold band (±0.6):** Small fluctuations don't trigger changes
3. **Minimum streak (≥2):** Must answer 2+ correct in a row to increase difficulty
4. **Momentum cap (±2.0):** Prevents runaway momentum

## 7. Score Calculation

```
function calculateScore(isCorrect, difficulty, streak):
    streakMultiplier = min(1.0 + streak * 0.1, 3.0)   // Capped at 3x
    difficultyWeight = 1.0 + (difficulty - 1) * 0.25   // 1.0 to 3.25
    
    if isCorrect:
        scoreDelta = round(10 * difficultyWeight * streakMultiplier)
    else:
        scoreDelta = 0    // No negative scoring, streak resets instead
    
    return { scoreDelta, streakMultiplier, difficultyWeight }
```

## 8. Leaderboard Update Strategy

1. After each answer submission, update `leaderboard_score` and `leaderboard_streak` via `findOneAndUpdate` with upsert
2. Invalidate cached leaderboard data immediately
3. Fetch fresh leaderboard from DB
4. Broadcast update to all SSE-connected clients
5. User rank calculated as `countDocuments({ value > user.value }) + 1`

## 9. Edge Cases Handled

| Edge Case | How It's Handled |
|-----------|-----------------|
| **Ping-pong instability** | Momentum-based system with decay (0.7), threshold band (±0.6), and minimum streak requirement |
| **Duplicate answer submission** | `idempotencyKey` with unique index — returns previous result without re-processing |
| **Streak reset on wrong answer** | `newStreak = isCorrect ? streak + 1 : 0` |
| **Streak decay after inactivity** | `shouldDecayStreak()` checks `lastAnswerAt` — if >30 min, streak and momentum reset to 0 |
| **Difficulty boundary conditions** | Clamped to [1, 10] — `Math.min/max` prevents out-of-bounds |
| **No questions at target difficulty** | Falls back to adjacent difficulties (±1, ±2, ±3) |
| **Concurrent state updates** | `stateVersion` field for optimistic concurrency — updates only succeed if version matches |
| **Rate limiting** | Global: 100 req/min; Answer submissions: 5 per 10 seconds |
| **Redis unavailable** | Graceful degradation — all cache operations fail silently, app reads from MongoDB |
| **User not found** | Returns 404; user state auto-created on first quiz request |
| **Race condition on user registration** | Catches MongoDB duplicate key error (11000), returns existing user |
| **Last question repetition** | Filters out `lastQuestionId` from available question pool |

## 10. Non-Functional Requirements

| Requirement | Implementation |
|-------------|---------------|
| **Strong consistency** | Single MongoDB write per answer with `stateVersion` optimistic locking |
| **Idempotent submitAnswer** | Unique `idempotencyKey` index on `answer_log`; duplicates return cached result |
| **Rate limiting** | `express-rate-limit` — global 100/min + answer-specific 5/10s |
| **Stateless app servers** | No in-memory user state; all state in MongoDB/Redis |
| **Real-time updates** | SSE for leaderboards; state updated in DB before response |
| **Containerization** | Docker multi-stage builds + docker-compose with Redis service |
