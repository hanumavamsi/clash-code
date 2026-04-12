# Replay & Practice Mode — UX + Routing Proposal

## Overview
Move questions from inline display in MatchDetailModal to a **dedicated replay experience** that mimics real matches without timers or opponents. Users can replay/practice individual questions from their match history.

---

## Current State (Before)
```
Home (page.tsx)
└── LobbyControls
    ├── Find Match / Create / Join (existing tabs)
    └── History Tab (new in Phase 3)
        └── MatchHistoryFeed
            └── MatchCard (clickable)
                └── MatchDetailModal
                    └── QuestionReviewPanel (INLINE)
                        ├── Question description
                        ├── Your submission code
                        ├── View Solution button
                        └── Editorial solution
```

**Problem:** Questions are shown in a modal with limited space, code review is cramped, and users can't really practice.

---

## Proposed New Structure

### 1. **MatchDetailModal Changes**
- **Remove:** QuestionReviewPanel components (inline questions)
- **Add:** "Replay Question" button for each question
- **Show:** Summary of all questions with clickable links

```
MatchDetailModal
├── Match Header (outcome, players, ELO delta)
├── Quick Question List
│   └── Per question:
│       ├── Q1: Title + Difficulty + Status
│       ├── "Replay" button → routes to /replay/[matchId]/[questionId]
│       └── "View Solution" link → /api/questions/[id]/solution (stays inline)
└── No QuestionReviewPanel
```

### 2. **New Replay Route Structure**

#### Route A: `/replay/[matchId]/[questionId]`
**Purpose:** Replay a specific question from a past match

**URL Examples:**
```
/replay/match-abc123/question-q456
/replay/match-xyz789/question-q789
```

**What It Shows:**
- Same game interface as `/game/[roomId]` but for **solo replay**
- Problem statement (read-only)
- Code editor with user's previous submission pre-filled
- Test cases (readonly)
- Submit button to test against cases
- **No timer**
- **No opponent stats**
- **No match end conditions** (user chooses when to stop)

**Flow:**
```
User clicks "Replay" on a question
         ↓
Router navigates to /replay/[matchId]/[questionId]
         ↓
Fetch question details + user's previous submission
         ↓
Load game editor interface (reuse EditorSurface)
         ↓
User edits code, submits to run against test cases
         ↓
Shows results (pass/fail, execution time)
         ↓
User can:
    - Modify and retry infinitely
    - See editorial solution (button in sidebar)
    - Go back to match summary
```

#### Route B: `/practice/[questionId]` (optional Phase 5)
**Purpose:** Practice a question without match context

**Different from Replay:**
- Not tied to a specific match
- All questions available (from question bank)
- User chooses difficulty level to practice
- Could feed into statistics (practice vs competitive)

---

## URL Routing Architecture

### New Routes to Create

| Route | Type | Purpose |
|-------|------|---------|
| `/replay/[matchId]/[questionId]` | Dynamic | Replay a specific Q from match |
| `/replay/[matchId]` | Dynamic | Full match replay (multiple Qs in sequence) |
| `/practice/[questionId]` | Dynamic | Practice any question (Phase 5) |

### Preserved Routes (Unchanged)
| Route | Purpose |
|-------|---------|
| `/` | Home + History |
| `/game/[roomId]` | Live competitive match |
| `/challenge/[token]` | Challenge link |
| `/room/[roomId]` | Pre-game lobby |

---

## Component Architecture

### New Components to Create

**1. `ReplayPage.tsx` (`/replay/[matchId]/[questionId]/page.tsx`)**
- Container component
- Fetches match + question data
- Passes to ReplayGame component

**2. `ReplayGame.tsx`**
- **Reuses:** EditorSurface, ProblemPanel, TestCasesBlock (from live game)
- **Modified:** 
  - No GameHeader (timer/opponent)
  - No WinnerModal (no match end)
  - Add "Question Complete?" action bar
  - Add back button to match summary

**3. `MatchSummary.tsx`** (refactored from MatchDetailModal)
- Shows match overview (players, ELO, outcome)
- Quick question list with Replay buttons
- NO expanded question content inline

### Components to Modify

**1. `MatchDetailModal.tsx`**
- Remove QuestionReviewPanel import
- Remove expanded question display
- Add clickable question summary rows
- Each row: Title + Status + [Replay] [Solution]

**2. `QuestionReviewPanel.tsx`** 
- Move to `/dashboard/legacy/` (deprecated but keep for reference)
- OR refactor as a modal/popover for solution viewing only

---

## API Endpoints (New/Updated)

### New Endpoints Needed

**1. GET `/api/replay/[matchId]/[questionId]`**
- Returns question + match context
- Includes user's previous submission from that match

```typescript
{
  match: {
    id: string,
    opponent: User,
    endTime: Date,
    outcome: 'win' | 'loss' | 'draw'
  },
  question: {
    id: string,
    title: string,
    description: string,
    difficulty: string,
    args: string[],
    returnType: string,
    constraints: string[],
    testCases: TestCase[]
  },
  userSubmission: {
    code: string,
    language: string,
    status: 'ACCEPTED' | 'WRONG_ANSWER' | 'PENDING'
  }
}
```

**2. POST `/api/replay/[questionId]/test`** 
- Run user's code against test cases
- Same as `/api/judge` but for replay
- Doesn't create Match record or update ELO

```typescript
POST /api/replay/q123/test
{
  code: string,
  language: string
}

Response: {
  passed: number,
  total: number,
  results: TestResult[],
  executionTime: number
}
```

### Modified Endpoints

**GET `/api/matches/[matchId]`** — Already updated for summary view
- Lightweight version (no detailed questions)
- Only return match metadata + question IDs

---

## UX Flow Diagrams

### Current (Before)
```
MatchCard (click)
    ↓
MatchDetailModal (large, scrollable)
    ├── Match header
    ├── Q1 (accordion, pre-loaded)
    │   ├── Description
    │   ├── Your code
    │   └── View Solution (on-demand)
    ├── Q2 (accordion, pre-loaded)
    └── Q3 (accordion, pre-loaded)
```

### Proposed (After)
```
MatchCard (click)
    ↓
MatchSummary (compact)
    ├── Match header (outcome, players, ELO)
    ├── Q1 Summary
    │   ├── Title | Difficulty | Status
    │   └── [Replay] [Solution]
    ├── Q2 Summary
    └── Q3 Summary
        ↓
        [User clicks Replay on Q2]
        ↓
    ReplayPage (/replay/match-abc/q2)
        ├── Problem panel (read-only)
        ├── Code editor (editable)
        ├── Test cases & results
        └── Action: Submit / Back / View Solution
```

---

## User Experience Details

### Replay Screen Layout

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Match  │  Q2: Sum of Two Integers │  Medium  │
├────────────────────────────────────┬────────────────────┤
│                                    │                    │
│  PROBLEM PANEL                     │  EDITOR SURFACE    │
│  ────────────────────────────────  │  ──────────────────│
│                                    │                    │
│  Description                       │  Your previous     │
│  Constraints                       │  submission:       │
│  Function sig                      │                    │
│  Examples                          │  function sol(..){ │
│                                    │    // edit here    │
│                                    │  }                 │
├────────────────────────────────────┴────────────────────┤
│  TEST CASES                    │  RESULTS           │   │
│  ─────────────────────────────────────────────────────│
│  Case 1: [1, 2] → 3  ✓         │  Results:          │   │
│  Case 2: [2, 3] → 5  ✓         │  Passed: 3/3       │   │
│  Case 3: [0, 0] → 0  ✓         │  Time: 2.1ms       │   │
│                                 │                    │   │
│  [Submit] [View Solution]       │  [Back] [Solution] │   │
└────────────────────────────────────────────────────────┘
```

### Key UI Elements

**Header Bar**
- Back arrow → returns to MatchDetailModal
- Question title (centered)
- Difficulty badge
- Language selector (bottom right of editor)

**Action Bar (bottom)**
- `[Submit]` — Run code against test cases
- `[View Solution]` — Show editorial solution
- `[Back to Match]` — Return to match summary

**Right Sidebar (Optional)**
- Match context: "Match #3 vs PlayerName"
- Link to opponent profile
- ELO delta from original match
- Timestamp of original match

---

## Data Flow for Replay

```
1. User is in MatchDetailModal
2. Clicks "Replay Q2"
3. Router: /replay/[matchId]/[questionId]
4. ReplayPage fetches:
   - GET /api/replay/match-abc/question-q2
   - Returns question + user's submission from that match
5. ReplayGame component loads with:
   - Problem statement (read-only)
   - Editor pre-filled with previous code
   - Test cases
6. User edits code
7. Clicks Submit
8. POST /api/replay/q2/test { code, language }
9. Returns pass/fail for each test case
10. Display results inline
11. User can:
    - Click "View Solution" → fetches /api/questions/q2/solution
    - Click "Back" → navigate back to MatchDetailModal
    - Edit and retry
```

---

## Implementation Phases

### Phase 4A — Replay Route & UI (2-3 days)
- Create `/replay/[matchId]/[questionId]/page.tsx`
- Create `ReplayGame.tsx` component
- Refactor MatchDetailModal to remove inline questions
- Create MatchSummary component
- Add API endpoint `GET /api/replay/[matchId]/[questionId]`

### Phase 4B — Replay Testing (1 day)
- Create `POST /api/replay/[questionId]/test`
- Test code execution sandbox (reuse judge logic)
- Add error handling

### Phase 5 — Practice Mode (future)
- Create `/practice/[questionId]` route
- Separate practice vs. replay tracking
- Add practice statistics

---

## Benefits of This Approach

| Benefit | Impact |
|---------|--------|
| **Space** | MatchDetailModal is compact, questions get full screen |
| **Focus** | Users can deep-dive on one Q without distractions |
| **Practice** | Can iterate on code without match pressure |
| **Reusability** | Replay uses same editor as live game (less code) |
| **Scalability** | Easy to extend to practice mode (Phase 5) |
| **Navigation** | Clear back button to match context |

---

## Open Questions

1. **Concurrent replay limit?** Can user replay multiple questions at once?
   → Propose: No (one at a time, must go back to match to start new replay)

2. **Save replay attempts?** Should we track practice stats?
   → Propose: No for Phase 4 (but schema-ready for Phase 5)

3. **Solution visibility?** When can user see solution during replay?
   → Propose: Always (same as dashboard, removes time pressure)

4. **Opponent stats in sidebar?** Show match opponent?
   → Propose: Yes, lightweight (name + ELO delta)

5. **Multiple languages?** Can user solve in different language than original?
   → Propose: Yes, selector on editor (reuse existing logic)

---

## Files to Create

```
src/app/replay/[matchId]/[questionId]/page.tsx     (new route)
src/components/replay/ReplayGame.tsx               (new component)
src/components/replay/ReplayHeader.tsx             (new component)
src/components/dashboard/MatchSummary.tsx          (refactored)
src/app/api/replay/[matchId]/[questionId]/route.ts (new API)
src/app/api/replay/[questionId]/test/route.ts      (new API)
```

## Files to Modify

```
src/components/dashboard/MatchDetailModal.tsx      (remove inline Qs)
src/components/home/LobbyControls.tsx              (no change)
```

---

## Summary

**Before:** Matches show all questions inline in a cramped modal
**After:** Matches show a compact summary; clicking "Replay" opens a full-screen editor for dedicated practice

**Routes:**
- `/` — Home + History (unchanged)
- `/game/[roomId]` — Live match (unchanged)
- `/replay/[matchId]/[questionId]` — **NEW** Replay question
- `/replay/[matchId]` — **NEW** Sequential replay (optional)
- `/practice/[questionId]` — **NEW** Practice any Q (Phase 5)

This creates a clear separation between **reviewing** (match history) and **practicing** (replay editor).
