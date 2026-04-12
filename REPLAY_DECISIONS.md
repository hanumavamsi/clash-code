# Replay Mode — Design Decisions & Trade-offs

## Decision 1: Where should questions live?

### Option A: Inline in MatchDetailModal (Current)
```
Pros:
  ✓ Everything in one place
  ✓ Easy to implement (done!)
  ✓ No new routes needed

Cons:
  ✗ Very cramped UI
  ✗ Hard to read code
  ✗ Can't practice/iterate
  ✗ Slow to load all questions
```

### Option B: Separate Replay Route ← RECOMMENDED
```
/replay/[matchId]/[questionId]

Pros:
  ✓ Full-screen editor
  ✓ Can practice/iterate
  ✓ Clear separation of concerns
  ✓ Reuses game components
  ✓ Scales to practice mode

Cons:
  ✗ Need new route
  ✗ Two clicks to start replay
  ✗ Extra API call
```

**Decision: Go with Option B**
- Better UX for practicing
- Supports future practice mode
- Not much more work

---

## Decision 2: Match context in replay?

### Option A: No context (lean)
```
Show in replay:
  ✓ Question only
  ✓ Test cases
  ✓ Editor

Pros:
  ✓ Minimal distraction
  ✓ Simpler component

Cons:
  ✗ User loses match context
  ✗ Can't see opponent name
  ✗ Can't see how this affects match outcome
```

### Option B: Minimal context (sidebar)
```
Show in sidebar:
  ✓ "Replaying: Q2 from match vs PlayerName"
  ✓ Match outcome: Victory (+25 ELO)
  ✓ Time: 2 days ago

Pros:
  ✓ Provides context
  ✓ Takes minimal space
  ✓ Motivational (shows why they're replaying)

Cons:
  ✗ Slightly more code
```

### Option C: Full context (right panel)
```
Show full match stats on right:
  ✓ Both players
  ✓ ELO before/after
  ✓ Match outcome

Pros:
  ✓ Full context

Cons:
  ✗ Takes up space on mobile
  ✗ Distracting
  ✗ Not needed during replay
```

**Decision: Go with Option B**
- Shows why they're replaying
- Minimal UI footprint
- Motivational (reminds of match outcome)

---

## Decision 3: Can user change language during replay?

### Option A: Lock to original language
```
User originally solved in JavaScript
→ Replay shows JavaScript only
→ Can't switch to Python

Pros:
  ✓ Simpler (less code)
  ✓ Ensures consistency

Cons:
  ✗ Can't try different approaches
  ✗ Discourages learning
```

### Option B: Allow language switching ← RECOMMENDED
```
User originally solved in JavaScript
→ Can switch to Python, C++, etc.

Pros:
  ✓ Learn different languages
  ✓ Try different approaches
  ✓ Reuses existing language selector

Cons:
  ✗ Need to handle code re-generation
```

**Decision: Go with Option B**
- Encourages learning
- Already have language selector
- Minimal extra code (reuse mapType() function)

---

## Decision 4: Timeline for replays

### Option A: Just submitted code
```
User's code from when they submitted it
→ May be different from final code

Pros:
  ✓ See what they actually submitted

Cons:
  ✗ If they rewound, it's not accurate
```

### Option B: Final code from match ← RECOMMENDED
```
User's final code at end of match
→ Last thing they wrote

Pros:
  ✓ Consistent reference point
  ✓ Matches their memory

Cons:
  ✗ May have changed mid-match
```

**Decision: Go with Option B**
- Use the submitted code record from Match.submissions
- This is the code that was judged

---

## Decision 5: Solution visibility in replay

### Option A: Hide solution initially
```
User solves → THEN can see solution

Pros:
  ✓ More challenging
  ✓ Forces them to think

Cons:
  ✗ Frustrating if stuck
  ✗ No time pressure, so why hide?
```

### Option B: Always available ← RECOMMENDED
```
Solution visible from start

Pros:
  ✓ Learning focused, not competitive
  ✓ Can compare approaches
  ✓ No time pressure

Cons:
  ✗ Might skip thinking and just copy
```

**Decision: Go with Option B**
- Replay is for practice, not competition
- No timer, so solution anytime makes sense
- User's choice whether to peek

---

## Decision 6: Should replay create records?

### Option A: Invisible to backend
```
Replay attempts not saved
→ Stats don't change
→ No replay history

Pros:
  ✓ Simpler (no DB writes)
  ✓ No data clutter

Cons:
  ✗ Can't track practice progress
```

### Option B: Track for analytics (Phase 5)
```
Replay attempts saved separately
→ Track practice vs competitive separately
→ Show practice statistics

Pros:
  ✓ Can show "practiced 5 times"
  ✓ Analytics for UX

Cons:
  ✗ Extra DB writes
  ✗ More complex
```

**Decision: Go with Option A for Phase 4**
- Keep Phase 4 simple
- Table is ready for Phase 5 if needed
- Can add tracking later without breaking changes

---

## Decision 7: Multiple questions in sequence?

### Option A: One question at a time
```
/replay/[matchId]/[questionId]

Route to single question
→ User goes back, clicks another

Pros:
  ✓ Simpler
  ✓ Clear focus
  ✓ Can pause between

Cons:
  ✗ Extra clicks
```

### Option B: Sequential replay ← DEFER TO PHASE 5
```
/replay/[matchId]

Loads Q1, Q2, Q3 in sequence
→ Like match but no opponent/timer

Pros:
  ✓ Feels like match
  ✓ Continuous flow

Cons:
  ✗ More complex
  ✗ Harder state management
```

**Decision: Go with Option A for Phase 4**
- Simpler to implement
- Users can replay in any order
- Easier to add sequential mode in Phase 5

---

## Decision 8: Test case limits?

### Option A: Show all test cases
```
Pros:
  ✓ Full transparency
  ✓ Know exactly what they're solving

Cons:
  ✗ Removes some challenge
```

### Option B: Hide some (like live match) ← RECOMMENDED
```
Show: public test cases (5)
Hide: private test cases (10)

Pros:
  ✓ Maintains some challenge
  ✓ Consistent with live match
  ✓ Still has hidden surprises

Cons:
  ✗ Slightly less transparent
```

**Decision: Go with Option B**
- Matches live match behavior
- Can't "cheat" by seeing all tests
- Users already know from match result

---

## Decision 9: Back button behavior?

### Option A: Just go back to MatchSummary
```
[Back] → close modal / nav back

Pros:
  ✓ Simple
  ✓ Consistent

Cons:
  ✗ Lose context if session timeout
```

### Option B: Preserve history
```
Browser back button works
→ Can go back multiple times
→ Route stack preserved

Pros:
  ✓ Feels natural
  ✓ Browser history works

Cons:
  ✗ Already default in Next.js!
```

**Decision: Go with Option B**
- It's the default with Next.js routing
- Users expect browser back to work
- No extra code needed

---

## Decision 10: Sandbox environment?

### Option A: Same judge as live matches
```
Use existing /api/judge endpoint

Pros:
  ✓ Code reuse
  ✓ Consistent results
  ✓ Works out of box

Cons:
  ✗ Might fail if live match is running
```

### Option B: Separate replay test endpoint ← RECOMMENDED
```
Create /api/replay/[id]/test

Pros:
  ✓ Independent from live matches
  ✓ No conflicts
  ✓ Can add replay-specific logic

Cons:
  ✗ Code duplication (minimal)
```

**Decision: Go with Option B**
- Cleaner separation
- Can timeout without affecting live matches
- Easier to add replay-specific features later

---

## Summary: Recommendations

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 1. Questions location | Separate route | Better UX + future scalable |
| 2. Match context | Minimal sidebar | Motivational without cluttering |
| 3. Language switching | Allowed | Encourages learning, reuses code |
| 4. Code version | Final submitted | Consistent reference |
| 5. Solution visibility | Always available | Practice-focused, not competitive |
| 6. Record attempts | No (Phase 4) | Keep simple, add later |
| 7. Question sequence | One at a time | Simpler, user controls order |
| 8. Test case limits | Hide private | Maintains some challenge |
| 9. Back button | Browser history | Natural, already works |
| 10. Sandbox | Separate endpoint | Clean separation, future-proof |

---

## Implementation Complexity

### Phase 4A: Core Replay (2-3 days)
- ✓ Route: `/replay/[matchId]/[questionId]`
- ✓ Components: ReplayGame, ReplayHeader
- ✓ API: GET replay context + POST test
- ✓ Pre-fill code from previous submission
- ✓ Show test results
- ✓ Solution button

### Phase 4B: Polish (1 day)
- ✓ Error handling
- ✓ Loading states
- ✓ Mobile responsive
- ✓ Visual consistency

### Phase 5: Practice Mode (future)
- ✓ Route: `/practice/[questionId]`
- ✓ Question selection (all questions)
- ✓ Practice statistics
- ✓ Sequential replay (optional)

---

## Open Questions for Stakeholder

1. **Should we track replay attempts?** (Decision 6)
   - Now: No. Later: Yes?
   
2. **Sequential replay?** (Decision 7)
   - Now: No (one Q at a time). Later: Yes?

3. **Practice mode timing?** (Phase 5)
   - After replay is working?
   - Or combine into one Phase 4?

4. **Should solution be visible always?** (Decision 5)
   - Or should we let users toggle between "challenge mode" (no solution) and "learning mode" (solution visible)?

---

**All decisions are reversible except routing.** The fundamental route `/replay/[matchId]/[questionId]` is baked in, but everything else can be tweaked based on user feedback.
