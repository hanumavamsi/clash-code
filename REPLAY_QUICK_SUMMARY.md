# Replay & Practice Mode — Quick Summary

## The Change

### Before (Current)
Questions shown **inline in MatchDetailModal** → cramped, limited space, no real practice

### After (Proposed)
Questions moved to **dedicated `/replay/[matchId]/[questionId]` route** → full-screen editor, isolated focus, practice environment

---

## New Routing Structure

```
Current Flows:
  Home → Click "History" tab
      → MatchCard click
      → MatchDetailModal (shows match + inline questions)

New Flows:
  Home → Click "History" tab
      → MatchCard click
      → MatchSummary (compact match overview)
          → Click "Replay" on question
          → /replay/match-abc/question-q2 (full-screen replay)
```

---

## URL Patterns

| Purpose | Route | Example |
|---------|-------|---------|
| Replay specific Q from match | `/replay/[matchId]/[questionId]` | `/replay/match-xyz/q-456` |
| Match summary (compact) | `/matches/[matchId]` (or modal) | `#match-xyz` |
| Practice any Q (Phase 5) | `/practice/[questionId]` | `/practice/q-456` |

---

## Replay Screen Experience

```
┌──────────────────────────────────────────────┐
│  ← Back  │  Q2: Sum Integers │  Medium      │
├──────────────────┬──────────────────────────┤
│                  │                          │
│  Problem Panel   │  Code Editor             │
│  (read-only)     │  (editable,              │
│                  │   pre-filled with        │
│  - Description   │   your previous code)    │
│  - Constraints   │                          │
│  - Examples      │                          │
│                  │                          │
├──────────────────┴──────────────────────────┤
│  Test Cases          │  Results             │
│  ─────────────────────────────────────────  │
│  ✓ Case 1: [1,2] → 3 │  Passed: 3/3       │
│  ✓ Case 2: [2,3] → 5 │  Time: 2.1ms       │
│  ✓ Case 3: [0,0] → 0 │                    │
│                      │  [Submit] [Solution]│
└──────────────────────────────────────────────┘
```

---

## Key Features of Replay

✅ **No Timer** — Practice at your own pace  
✅ **No Opponent** — Solo environment  
✅ **Infinite Retries** — Edit and re-test unlimited times  
✅ **Test Feedback** — See pass/fail on each test case  
✅ **Solution Access** — View editorial solution anytime  
✅ **Previous Code** — Pre-filled with your original submission  

---

## Components to Create/Modify

### New Components
- `ReplayPage.tsx` — Route handler
- `ReplayGame.tsx` — Game interface (no timer, no opponent)
- `ReplayHeader.tsx` — Minimal header with back button
- `MatchSummary.tsx` — Compact question list with replay buttons

### Modified Components
- `MatchDetailModal.tsx` — Remove inline questions, add replay buttons
- `QuestionReviewPanel.tsx` — Keep for solution viewing only

### New API Routes
- `GET /api/replay/[matchId]/[questionId]` — Fetch replay context
- `POST /api/replay/[questionId]/test` — Run code against tests

---

## Implementation Roadmap

### Phase 4A (2-3 days) — Build Replay UI
- Create `/replay/[matchId]/[questionId]` route
- Build ReplayGame component
- Update MatchDetailModal to link to replays
- Create MatchSummary component

### Phase 4B (1 day) — Test Execution
- Create test API endpoint
- Integrate with judge sandbox
- Add results display

### Phase 5 (future) — Practice Mode
- Extend to `/practice/[questionId]` route
- Add practice statistics tracking
- Build practice dashboard

---

## Why This Matters

| Problem | Solution |
|---------|----------|
| Match modal is cramped | Full-screen replay view |
| Can't practice, only review | Editable code, test against cases |
| No context about match | Sidebar shows match opponent & outcome |
| Questions get scrolled | Each Q gets dedicated screen |

---

## Navigation Example

```
User clicks "History" on home
    ↓
Sees list of past matches
    ↓
Clicks "vs PlayerName - 2 days ago"
    ↓
MatchSummary opens (modal or new page)
    Shows:
    - You: +25 ELO (Victory)
    - vs PlayerName
    - Questions: Q1 ✓ Q2 ✓ Q3 ✗
    ↓
User clicks "Replay" on Q3 (the one they failed)
    ↓
Opens /replay/match-xyz/question-q3
    - Sees problem statement
    - Previous code is in editor
    - Runs test cases
    - Can now solve it!
    ↓
User clicks "View Solution" (optional)
    - See editorial answer
    ↓
User clicks "Back to Match"
    - Returns to MatchSummary
```

---

## Benefits Summary

- 🎯 **Focused Practice** — One question at a time, full screen
- 🔄 **Iterate Freely** — No time pressure, infinite retries
- 📊 **Track Progress** — Before/after code comparison
- 🧠 **Learn Better** — See solution whenever ready
- ♻️ **Code Reuse** — Leverages existing game components
- 🚀 **Scalable** — Easy path to practice mode (Phase 5)

---

## Questions?

See full proposal: `REPLAY_PRACTICE_UX_PROPOSAL.md`
