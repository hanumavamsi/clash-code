# Phase 2 — API Routes for Match History
## Backend APIs

### ✅ Completed

#### 1. **GET /api/matches** — User Match History
**File:** `src/app/api/matches/route.ts`

- **Purpose:** Fetch paginated match history for the authenticated user
- **Authentication:** Required (NextAuth session)
- **Query Parameters:**
  - `limit` (optional, default 10, max 50) — Results per page
  - `offset` (optional, default 0) — Pagination offset
- **Response:**
  ```json
  {
    "matches": [
      {
        "id": "match-uuid",
        "opponent": { "id", "name", "image", "eloRating" },
        "outcome": "win|loss|draw",
        "userEloAfter": 1250,
        "eloDelta": 50,
        "questionCount": 5,
        "endTime": "2026-04-12T10:30:00Z",
        "duration": 15 // minutes
      }
    ],
    "pagination": { "limit", "offset", "total" }
  }
  ```
- **Features:**
  - Merges matches where user was player1 or player2
  - Calculates outcome relative to current user
  - Extracts ELO changes from eloAfter JSON
  - Paginates results for performance

---

#### 2. **GET /api/matches/[matchId]** — Match Details
**File:** `src/app/api/matches/[matchId]/route.ts`

- **Purpose:** Get full details for a specific match including questions and user's submissions
- **Authentication:** Required + Authorization (user must be a player)
- **Response:**
  ```json
  {
    "match": {
      "id": "match-uuid",
      "roomId": "room-uuid",
      "outcome": "win|loss|draw",
      "startTime": "2026-04-12T10:00:00Z",
      "endTime": "2026-04-12T10:15:00Z",
      "duration": 15,
      "player1": { "id", "name", "image", "eloRating" },
      "player2": { "id", "name", "image", "eloRating" },
      "winnerId": "user-uuid",
      "elo": {
        "before": 1200,
        "after": 1250,
        "delta": 50
      }
    },
    "questions": [
      {
        "id": "q-uuid",
        "title": "Sum of Array",
        "difficulty": "easy",
        "description": "...",
        "args": ["intArray"],
        "returnType": "int",
        "sampleTests": [...],
        "constraints": [...],
        "submission": {
          "id": "sub-uuid",
          "questionId": "q-uuid",
          "code": "function solution(arr) { ... }",
          "status": "ACCEPTED",
          "executionTime": 45,
          "createdAt": "2026-04-12T10:05:00Z"
        }
      }
    ]
  }
  ```
- **Features:**
  - Fetches questions by their IDs from `match.questionIds`
  - Includes user's submissions for each question
  - Calculates match duration
  - Authorization check prevents viewing other users' matches

---

#### 3. **GET /api/questions/[questionId]/solution** — Editorial Solution
**File:** `src/app/api/questions/[questionId]/solution/route.ts`

- **Purpose:** Get editorial/reference solution for a question
- **Authentication:** Required
- **Authorization:** User must have played at least one match with this question
- **Response:**
  ```json
  {
    "questionId": "q-uuid",
    "title": "Sum of Array",
    "solution": "function solution(arr) { return arr.reduce((a, b) => a + b, 0); }",
    "language": "javascript"
  }
  ```
- **Features:**
  - Access control prevents users from viewing solutions without playing
  - Queries `match.questionIds` to verify user eligibility
  - Returns 403 Forbidden if user hasn't played the question
  - Returns 404 if question has no solution

---

#### 4. **GET /api/users/[userId]/stats** — User Statistics
**File:** `src/app/api/users/[userId]/stats/route.ts`

- **Purpose:** Get public user statistics
- **Authentication:** Not required (public endpoint)
- **Response:**
  ```json
  {
    "user": {
      "id": "user-uuid",
      "name": "John Doe",
      "image": "https://...",
      "eloRating": 1350,
      "createdAt": "2026-01-01T00:00:00Z"
    },
    "stats": {
      "totalMatches": 42,
      "wins": 28,
      "losses": 12,
      "draws": 2,
      "winRate": 66.7
    }
  }
  ```
- **Features:**
  - Computes stats from matchesAsP1 and matchesAsP2 relations
  - Calculates win rate as percentage
  - Counts draws separately

---

#### 5. **TypeScript Types**
**File:** `src/types/dashboard.ts`

Exported types for frontend integration:
- `MatchListItem` — Single match from history
- `MatchListResponse` — Response from /api/matches
- `MatchDetail` — Match with full details
- `MatchDetailResponse` — Response from /api/matches/[matchId]
- `QuestionBase`, `QuestionWithSubmission` — Question objects
- `SolutionResponse` — Solution endpoint response
- `UserStats`, `UserStatsResponse` — Stats endpoint responses

---

## What's Enabled

✅ **Frontend can now:**
1. Fetch paginated match history for dashboard
2. View full details of any match the user participated in
3. See all questions from a match with user's submissions
4. Access editorial solutions (if user played the question)
5. View detailed user statistics

✅ **Authorization is enforced:**
- Users can only see solutions for questions they've played
- Users can only view details of matches they participated in
- Solution endpoint verifies match participation

---

## Next Steps

→ **Phase 3**: Build dashboard UI components and home page integration
→ **Phase 4**: Implement practice mode (re-attempt questions)
→ **Phase 5**: Add solution display in UI

---

## Files Created

- `src/app/api/matches/route.ts`
- `src/app/api/matches/[matchId]/route.ts`
- `src/app/api/questions/[questionId]/solution/route.ts`
- `src/app/api/users/[userId]/stats/route.ts`
- `src/types/dashboard.ts`

**Build Status:** ✅ Passes TypeScript and Next.js build
