# Routing & Architecture Diagrams

## Current vs Proposed App Structure

### Current (Phase 1-3)
```
src/app/
├── page.tsx                                  [Home]
│   └── components/home/LobbyControls.tsx
│       ├── Find Match tab
│       ├── Create Match tab
│       ├── Join Match tab
│       └── History tab (NEW)
│           └── MatchHistoryFeed
│               └── MatchCard (clickable)
│                   └── MatchDetailModal
│                       └── QuestionReviewPanel (INLINE) ⚠️
│
├── game/[roomId]/page.tsx                   [Live Competitive Match]
├── challenge/[token]/page.tsx                [Challenge Mode]
└── room/[roomId]/page.tsx                    [Pre-game Lobby]
```

### Proposed (Phase 4+)
```
src/app/
├── page.tsx                                  [Home]
│   └── components/home/LobbyControls.tsx
│       ├── Find Match tab
│       ├── Create Match tab
│       ├── Join Match tab
│       └── History tab
│           └── MatchHistoryFeed
│               └── MatchCard (clickable)
│                   └── MatchSummary (compact)
│                       ├── Question list with [Replay] buttons
│                       └── Each [Replay] links to:
│
├── replay/[matchId]/[questionId]/page.tsx  [REPLAY PRACTICE] ✨ NEW
│   └── ReplayGame.tsx (full-screen editor)
│
├── practice/[questionId]/page.tsx          [PRACTICE MODE] ✨ Phase 5
│   └── PracticeGame.tsx
│
├── game/[roomId]/page.tsx                  [Live Competitive Match] (unchanged)
├── challenge/[token]/page.tsx               [Challenge Mode] (unchanged)
└── room/[roomId]/page.tsx                   [Pre-game Lobby] (unchanged)
```

---

## Component Hierarchy

### Current (Phase 1-3)
```
App
└── Home (page.tsx)
    └── LobbyControls
        ├── FindMatchTab
        ├── CreateMatchTab
        ├── JoinMatchTab
        └── HistoryTab
            └── MatchHistoryFeed
                ├── MatchCard (x10, paginated)
                │   └── onClick: open MatchDetailModal
                └── MatchDetailModal (portal/modal)
                    ├── Match Header
                    ├── Player Stats
                    └── QuestionReviewPanel (x3)
                        ├── Question header (accordion)
                        ├── Description
                        ├── Constraints
                        ├── Code submission
                        └── Solution viewer
```

### Proposed (Phase 4A)
```
App
├── Home (page.tsx)
│   └── LobbyControls
│       ├── FindMatchTab
│       ├── CreateMatchTab
│       ├── JoinMatchTab
│       └── HistoryTab
│           └── MatchHistoryFeed
│               ├── MatchCard (x10, paginated)
│               │   └── onClick: open MatchSummary
│               └── MatchSummary (portal/modal)
│                   ├── Match Header
│                   ├── Player Stats
│                   └── Question Summary List
│                       ├── Q1: Title | Difficulty | Status
│                       │   ├── [Replay] → navigate to /replay/match-abc/q1
│                       │   └── [Solution] → fetch & show inline
│                       ├── Q2: Title | Difficulty | Status
│                       └── Q3: Title | Difficulty | Status
│
├── Replay Route
│   └── ReplayPage (/replay/[matchId]/[questionId])
│       └── ReplayGame
│           ├── ReplayHeader
│           │   ├── Back button
│           │   ├── Question title
│           │   └── Difficulty badge
│           ├── ProblemPanel (read-only)
│           ├── EditorSurface (editable, pre-filled)
│           ├── TestCasesBlock
│           └── ReplayActions
│               ├── [Submit] → test code
│               ├── [View Solution]
│               └── [Back to Match]
│
└── [Other routes unchanged]
```

---

## State Flow Diagram

### Current (Phase 1-3)
```
MatchHistoryFeed
├── [state] matches: MatchListItem[]
├── [state] selectedMatchId: string | null
├── [state] offset: number (pagination)
│
├── fetchMatches() → GET /api/matches?limit=10&offset=0
│   └── setMatches(data)
│
└── onClick (MatchCard)
    └── setSelectedMatchId(matchId)
        └── MatchDetailModal opens
            ├── fetchMatchDetail() → GET /api/matches/[matchId]
            ├── setData(matchDetail)
            └── render QuestionReviewPanel (inline)
                ├── onClick "View Solution"
                └── fetch /api/questions/[id]/solution
```

### Proposed (Phase 4A)
```
MatchHistoryFeed
├── [state] matches: MatchListItem[]
├── [state] selectedMatchId: string | null
├── [state] offset: number (pagination)
│
├── fetchMatches() → GET /api/matches?limit=10&offset=0
│   └── setMatches(data)
│
└── onClick (MatchCard)
    └── setSelectedMatchId(matchId)
        └── MatchSummary opens
            ├── fetch /api/matches/[matchId]?summary=true
            ├── render question list (Q1, Q2, Q3)
            └── onClick "Replay" on Q2
                └── router.push('/replay/match-abc/q2')
                    └── ReplayPage component
                        ├── fetch /api/replay/match-abc/q2
                        ├── setQuestion(data)
                        ├── setPreviousCode(data.userSubmission.code)
                        └── ReplayGame renders
                            ├── ProblemPanel (read-only)
                            ├── EditorSurface (code = previousCode)
                            ├── onClick "Submit"
                            │   └── POST /api/replay/q2/test { code }
                            │       └── setResults(pass/fail)
                            └── onClick "Back"
                                └── router.back() → MatchSummary
```

---

## API Endpoint Architecture

### Current (Phase 1-3)
```
GET  /api/matches                              List match history
GET  /api/matches/[matchId]                    Match with inline questions
GET  /api/questions/[questionId]/solution      Editorial solution
POST /api/judge/submit                         Run during live match
```

### Proposed (Phase 4)
```
EXISTING (no change):
  GET  /api/matches                              List match history
  GET  /api/questions/[questionId]/solution      Editorial solution
  POST /api/judge/submit                         Run during live match

MODIFIED:
  GET  /api/matches/[matchId]                    Now COMPACT (no questions)
                                                 Returns match metadata + Q IDs only

NEW:
  GET  /api/replay/[matchId]/[questionId]        Fetch question + user's code
       Response: {
         match: { id, opponent, endTime, outcome },
         question: { id, title, description, ... },
         userSubmission: { code, language, status }
       }

  POST /api/replay/[questionId]/test             Test code (no ELO update)
       Request: { code, language }
       Response: {
         passed: number,
         total: number,
         results: TestResult[],
         executionTime: number
       }
```

### Phase 5 (Practice Mode)
```
NEW:
  GET  /api/practice/[questionId]                Fetch question (no match context)
  POST /api/practice/[questionId]/test           Test code for practice
  GET  /api/practice/stats                       User's practice statistics
```

---

## URL Structure & Navigation Map

```
HOME PAGE (/)
├── History Tab active
│   └── /
│       └── Scroll → see matches list
│       └── Click match card
│           └── MatchSummary modal/overlay
│               └── /
│   └── Replay path:
│       /replay/match-abc-123/question-q-456
│       /replay/match-xyz-789/question-q-789

MATCH DETAIL (compact)
├── Route: (same /, modal)
├── Shows: Players, ELO, quick questions
└── Can navigate to /replay/[id]/[id]

REPLAY QUESTION (full page)
├── Route: /replay/[matchId]/[questionId]
│   Examples:
│   - /replay/match-abc-123/question-q-456
│   - /replay/match-xyz-789/question-q-789
├── Shows: Problem, editor, tests
└── Can navigate back to /

PRACTICE QUESTION (Phase 5)
├── Route: /practice/[questionId]
│   Examples:
│   - /practice/question-q-456
│   - /practice/question-q-789
├── Shows: Problem, editor, tests (no match context)
└── Separate from replay

LIVE GAME (unchanged)
├── Route: /game/[roomId]
├── Shows: Match timer, opponent, live scoring
└── Ends when match completes

CHALLENGE (unchanged)
├── Route: /challenge/[token]
└── Pre-generated match

LOBBY (unchanged)
├── Route: /room/[roomId]
└── Pre-game waiting area
```

---

## Data Model - Replay Context

```typescript
// What ReplayPage receives from /api/replay/[matchId]/[questionId]

interface ReplayContext {
  // Match context
  match: {
    id: string;
    roomId: string;
    player1: UserProfile;
    player2: UserProfile;
    outcome: 'win' | 'loss' | 'draw';  // relative to current user
    elo: {
      before: number;
      after: number;
      delta: number;
    };
    endTime: Date;
  };

  // Question to replay
  question: {
    id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    args: string[];  // parameter types
    returnType: string;
    constraints: string[];
    examples: Example[];
    testCases: TestCase[];  // visible test cases
    hiddenTestCases: number;  // count of hidden tests
  };

  // User's previous attempt from this match
  userSubmission: {
    code: string;
    language: string;
    status: 'ACCEPTED' | 'WRONG_ANSWER' | 'PENDING';
    executionTime?: number;
    output?: string;
  };
}
```

---

## Session Management During Replay

```
Replay ≠ Live Match

REPLAY:
  ✓ No socket.io (no opponent)
  ✓ No timer
  ✓ No ELO updates
  ✓ Can retry infinitely
  ✓ Can view solution anytime
  ✓ Runs on test endpoint: POST /api/replay/[id]/test

LIVE MATCH (/game/[roomId]):
  ✓ Socket.io connection (opponent present)
  ✓ Timer (15:00)
  ✓ ELO updates on match end
  ✓ Once per question
  ✓ Solution hidden until after match
  ✓ Runs on judge endpoint: POST /api/judge/submit
```

---

## File Structure - New Files

```
src/app/
├── replay/
│   └── [matchId]/
│       └── [questionId]/
│           └── page.tsx                    ← New route
│
src/components/
├── replay/                                 ← New folder
│   ├── ReplayGame.tsx                      ← New component
│   ├── ReplayHeader.tsx                    ← New component
│   └── ReplayActions.tsx                   ← New component
│
├── dashboard/
│   ├── MatchSummary.tsx                    ← New component (refactored)
│   └── MatchDetailModal.tsx                ← Modified (no questions)
│
src/app/api/
├── replay/
│   ├── [matchId]/
│   │   └── [questionId]/
│   │       └── route.ts                    ← New API
│   └── [questionId]/
│       └── test/
│           └── route.ts                    ← New API
│
src/types/
├── replay.ts                               ← New types
```

---

## Summary Table

| Aspect | Current | Proposed |
|--------|---------|----------|
| **Questions shown in** | MatchDetailModal | Separate /replay route |
| **Screen space** | Cramped accordion | Full-screen editor |
| **Timer** | N/A | None (no timer) |
| **Opponent** | N/A | Not shown |
| **Retries** | N/A | Unlimited |
| **Test feedback** | Solution button only | Real-time per case |
| **Pre-filled code** | No | Yes (previous attempt) |
| **Routes** | / (modal) | /replay/[m]/[q] |
| **Components reused** | QuestionReviewPanel | EditorSurface, ProblemPanel |

