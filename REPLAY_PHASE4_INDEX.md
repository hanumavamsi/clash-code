# Phase 4 Replay & Practice Mode — Complete Specification Index

> **Status:** ✅ Design Complete — Ready for Implementation  
> **Target Phase:** Phase 4 (2-4 weeks)  
> **Related Phases:** Phase 3 (completed), Phase 5 (future practice mode)

---

## 📚 Documentation Map

### 1. **Executive Summary** — Start Here
📄 **File:** `REPLAY_QUICK_SUMMARY.md`
- One-page overview for stakeholders
- Visual layout of replay screen
- Key features and benefits
- Navigation flow example

### 2. **Comprehensive Proposal** — Technical Details
📄 **File:** `REPLAY_PRACTICE_UX_PROPOSAL.md` (416 lines)
- Full UX specification
- Routing architecture
- Component breakdown
- API design (request/response)
- Implementation phases (4A, 4B)
- Data flow diagrams
- 10 open questions answered

### 3. **Architecture Diagrams** — Visual Reference
📄 **File:** `ROUTING_DIAGRAMS.md` (393 lines)
- Current vs proposed app structure
- Component hierarchy (before/after)
- State flow diagrams
- API endpoint architecture
- URL structure and navigation map
- Data models
- File structure

### 4. **Design Decisions** — Trade-offs & Rationale
📄 **File:** `REPLAY_DECISIONS.md` (447 lines)
- 10 key decisions with pros/cons
- Recommended approach for each
- Implementation complexity roadmap
- Questions for stakeholder clarification

---

## 🎯 Quick Decision Summary

### The Core Change
```
BEFORE: Questions shown inline in MatchDetailModal (cramped)
AFTER:  Questions moved to /replay/[matchId]/[questionId] (full-screen editor)
```

### Key Design Decisions
| # | Decision | Recommendation |
|---|----------|-----------------|
| 1 | Questions location | ✓ Separate route |
| 2 | Match context | ✓ Minimal sidebar |
| 3 | Language switching | ✓ Allowed |
| 4 | Code version | ✓ Final submitted |
| 5 | Solution visibility | ✓ Always available |
| 6 | Record attempts | ✓ No (Phase 4) |
| 7 | Question sequence | ✓ One at a time |
| 8 | Test cases | ✓ Hide private |
| 9 | Back button | ✓ Browser history |
| 10 | Sandbox | ✓ Separate endpoint |

---

## 🗺️ Routing Structure

### New Routes
```
/replay/[matchId]/[questionId]    Full-screen editor for replaying a question
/replay/[matchId]                 Sequential replay (Phase 5 optional)
/practice/[questionId]            Practice any question (Phase 5)
```

### Preserved Routes
```
/                      Home + History (modified modal)
/game/[roomId]         Live competitive match (unchanged)
/challenge/[token]     Challenge mode (unchanged)
/room/[roomId]         Pre-game lobby (unchanged)
```

---

## 🏗️ Component Architecture

### New Components to Create
```
src/app/
└── replay/[matchId]/[questionId]/page.tsx    ← Route handler

src/components/
├── replay/
│   ├── ReplayGame.tsx                         ← Full game interface
│   ├── ReplayHeader.tsx                       ← Minimal header
│   └── ReplayActions.tsx                      ← Action bar (submit, back, solution)
└── dashboard/
    └── MatchSummary.tsx                       ← New, refactored from modal
```

### Components to Modify
```
src/components/dashboard/
├── MatchDetailModal.tsx          Remove inline questions, add replay buttons
└── QuestionReviewPanel.tsx       Keep for solution viewer only (extract)
```

### Components Reused (No changes needed)
```
EditorSurface      ✓ From /game (editor with syntax highlighting)
ProblemPanel       ✓ From /game (problem statement display)
TestCasesBlock     ✓ From /game (test cases + results)
```

---

## 📡 API Endpoints

### New Endpoints
```typescript
GET  /api/replay/[matchId]/[questionId]
     Response: { match, question, userSubmission }
     
POST /api/replay/[questionId]/test
     Request: { code, language }
     Response: { passed, total, results, executionTime }
```

### Modified Endpoints
```typescript
GET  /api/matches/[matchId]
     Change: Make compact (remove detailed questions)
     Now returns: match metadata + question IDs only
```

### Unchanged Endpoints
```typescript
GET  /api/matches                    List match history
GET  /api/questions/[id]/solution    Editorial solution
POST /api/judge/submit               Live match judge
```

---

## 📋 Implementation Checklist

### Phase 4A: Core Replay (2-3 days)
- [ ] Create `/replay/[matchId]/[questionId]` route
- [ ] Build `ReplayGame.tsx` component
  - [ ] Reuse EditorSurface from game
  - [ ] Reuse ProblemPanel from game
  - [ ] Reuse TestCasesBlock from game
- [ ] Build `ReplayHeader.tsx` component
- [ ] Build `ReplayActions.tsx` component
- [ ] Create `MatchSummary.tsx` component
- [ ] Update `MatchDetailModal.tsx` (remove questions, add replay buttons)
- [ ] Create API: `GET /api/replay/[matchId]/[questionId]`
- [ ] Create API: `POST /api/replay/[questionId]/test`
- [ ] Add TypeScript types: `src/types/replay.ts`

### Phase 4B: Polish & Testing (1 day)
- [ ] Error handling (network, timeout, etc.)
- [ ] Loading states
- [ ] Mobile responsive design
- [ ] Visual consistency with rest of app
- [ ] Code refactor if needed
- [ ] Integration tests

### Phase 5: Practice Mode (future)
- [ ] Create `/practice/[questionId]` route
- [ ] Question selector/search
- [ ] Practice statistics tracking
- [ ] Sequential replay (optional)

---

## 🎮 User Experience Flow

### Current (Phase 1-3)
```
Home
  → Click "History"
  → MatchCard
  → MatchDetailModal (large, scrollable)
    → Questions shown inline (cramped)
    → Can view submission and solution
```

### New (Phase 4)
```
Home
  → Click "History"
  → MatchCard
  → MatchSummary (compact modal)
    → Quick question list
    → Click "Replay" on Q2
    → /replay/match-abc/q2 (full-screen)
      → Problem panel (read-only)
      → Code editor (pre-filled with previous code)
      → Test cases and results
      → Actions: Submit, View Solution, Back
    → Click "Back"
    → Return to MatchSummary
```

---

## 🔍 Key Features

### Replay Experience
✅ **Full-screen editor** — Dedicated space for each question  
✅ **No timer** — Practice at your own pace  
✅ **No opponent** — Solo environment  
✅ **Infinite retries** — Edit and test as many times as needed  
✅ **Pre-filled code** — Starts with your previous submission  
✅ **Real-time feedback** — See pass/fail for each test case  
✅ **Solution button** — View editorial solution anytime  
✅ **Language switching** — Try solving in different language  
✅ **Match context** — Sidebar shows match opponent and outcome  
✅ **Back navigation** — Easy return to match summary  

---

## 🧠 Data Models

### ReplayContext (API Response)
```typescript
{
  match: {
    id: string;
    roomId: string;
    player1: UserProfile;
    player2: UserProfile;
    outcome: 'win' | 'loss' | 'draw';
    elo: { before, after, delta };
    endTime: Date;
  };
  
  question: {
    id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    args: string[];
    returnType: string;
    constraints: string[];
    examples: Example[];
    testCases: TestCase[];
    hiddenTestCases: number;
  };
  
  userSubmission: {
    code: string;
    language: string;
    status: 'ACCEPTED' | 'WRONG_ANSWER' | 'PENDING';
    executionTime?: number;
  };
}
```

### TestResult (API Response)
```typescript
{
  passed: number;           // 3
  total: number;            // 3
  results: [
    {
      testCase: number;     // 0
      passed: boolean;      // true
      expected: string;     // "3"
      actual: string;       // "3"
      executionTime: number; // 2.1 (ms)
      error?: string;       // optional error message
    }
  ];
  executionTime: number;    // 2.1 (total, ms)
}
```

---

## 🔗 Document Dependencies

```
REPLAY_QUICK_SUMMARY.md
├── For: Stakeholder review (1 page)
├── Audience: Product, Design, Leadership
└── Time: 5 min read

REPLAY_PRACTICE_UX_PROPOSAL.md ← MAIN SPEC
├── For: Detailed specification
├── Audience: Engineering team
├── Includes: Routes, components, APIs, flows
├── Reference: ROUTING_DIAGRAMS.md (visual)
└── Time: 30 min read

ROUTING_DIAGRAMS.md
├── For: Visual architecture reference
├── Audience: Backend, Frontend engineers
├── Includes: Before/after, state flows, file structure
└── Time: 15 min read

REPLAY_DECISIONS.md
├── For: Design rationale and trade-offs
├── Audience: Technical leads, architects
├── Includes: 10 decisions with pros/cons
└── Time: 20 min read

REPLAY_PHASE4_INDEX.md (this file)
├── For: Quick reference and navigation
├── Audience: Everyone
├── Includes: Checklists, summary, links
└── Time: 10 min read
```

---

## ⚡ Quick Reference

### For Stakeholders
→ Read: `REPLAY_QUICK_SUMMARY.md` (5 min)  
→ Then: `REPLAY_DECISIONS.md` (questions answered, 10 min)

### For Engineers Starting Phase 4A
→ Read: `REPLAY_PRACTICE_UX_PROPOSAL.md` (main spec, 30 min)  
→ Reference: `ROUTING_DIAGRAMS.md` (architecture, 15 min)  
→ Consult: `REPLAY_DECISIONS.md` (when unsure, 20 min)

### For Code Review
→ Check: Components list (components created/modified)  
→ Check: APIs list (new endpoints)  
→ Check: Routes structure (routing changes)  
→ Compare: Before/after in `ROUTING_DIAGRAMS.md`

---

## 📊 Effort Estimate

| Phase | Duration | Work Items |
|-------|----------|-----------|
| 4A | 2-3 days | Routes, components, APIs, integration |
| 4B | 1 day | Error handling, tests, polish |
| Total | 3-4 days | Full replay feature working |

---

## 🚀 Success Criteria

- [ ] Replay route works end-to-end
- [ ] Can pre-fill previous code from match
- [ ] Can test code and see results
- [ ] Can view solution during replay
- [ ] Can retry infinitely
- [ ] Back button works
- [ ] Mobile responsive
- [ ] No timer, no opponent visible
- [ ] Matches show compact summary with replay buttons
- [ ] All tests passing

---

## ❓ Common Questions

**Q: Why move questions to a separate route?**  
A: MatchDetailModal was cramped. Full-screen editor gives better UX for practicing. Also scales to practice mode (Phase 5).

**Q: Should I record replay attempts?**  
A: No for Phase 4 (keep simple). Table is ready for Phase 5 if you want practice stats.

**Q: Can users change language during replay?**  
A: Yes. They might want to try Python after originally solving in JavaScript.

**Q: When can they see the solution?**  
A: Anytime. No time pressure in replay, so it's learning-focused, not competitive.

**Q: What if live match is running during replay?**  
A: No conflict. Replay uses separate sandbox endpoint (`/api/replay/[id]/test`).

**Q: Can I add practice mode in Phase 4?**  
A: Sure, but Phase 5 scope. Phase 4 focuses on replay (from matches). Phase 5 adds practice (any question).

---

## 🎓 Related Documentation

From earlier phases:
- Phase 1 Summary: `PHASE_1_SUMMARY.md` (schema, backend)
- Phase 2 Summary: `PHASE_2_SUMMARY.md` (APIs)
- Phase 3 Summary: `PHASE_3_SUMMARY.md` (dashboard UI)
- Bug Fixes: `BUGS_FIXED.md` (issues from testing)
- Session Summary: `SESSION_SUMMARY.md` (everything so far)

---

## ✅ Next Steps

1. **Review** this proposal (you're reading it!)
2. **Decide** on the 4 open questions in `REPLAY_DECISIONS.md`
3. **Start Phase 4A** — Create `/replay/[matchId]/[questionId]` route
4. **Review** `ROUTING_DIAGRAMS.md` before coding
5. **Reference** `REPLAY_PRACTICE_UX_PROPOSAL.md` during implementation
6. **Test** all flows before merging

---

## 📝 Notes

- All decisions are reversible except routing
- The route `/replay/[matchId]/[questionId]` is baked in, but features can be tweaked
- Reuse existing components (EditorSurface, ProblemPanel) to save time
- Keep Phase 4 focused on replay; defer practice mode to Phase 5
- This spec is frozen; any changes after approval should go through design review

---

**Last Updated:** 2026-04-12  
**Status:** Design Review Complete ✅  
**Ready for:** Implementation Sprint (Phase 4A start)
