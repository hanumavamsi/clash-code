# Bugs Found & Fixed During MVP Testing

## Bug 1: Match History API 500 Error ❌ → ✅

### Issue
When fetching match history via `/api/matches`, the API returned a 500 error. The issue occurred when trying to display matches that had `NULL` values for `player1Id` and `player2Id`.

### Root Cause
- Some matches in the database had `player1Id` and `player2Id` as NULL (created before Phase 1 schema updates)
- The API tried to access `match.player1` and `match.player2` without null-checking
- When opponent was null, accessing properties caused a runtime error

### Fix
**File:** `src/app/api/matches/route.ts`

1. Added filter to exclude matches with NULL player IDs:
   ```typescript
   .filter(m => m.player1Id && m.player2Id)
   ```

2. Added null guard for opponent:
   ```typescript
   if (!opponent) return null;
   ```

3. Filter out null results from the response:
   ```typescript
   .filter(m => m !== null)
   ```

4. Improved error logging:
   ```typescript
   const msg = error instanceof Error ? error.message : "Internal Server Error";
   return NextResponse.json({ error: msg, details: error }, { status: 500 });
   ```

---

## Bug 2: Question Contains Algorithm Explanation ❌ → ✅

### Issue
The "Sum of Two Integers" question (`id: 736b1698-4d27-4389-8863-d18f8d83eb97`) contained a full **Bitwise Addition Algorithm** explanation in its description, which gives away the solution.

### Root Cause
This was part of the seeded question data — the description included the algorithm steps and walkthrough instead of just describing the problem.

### Fix
**File:** Database (Question record)

Removed the algorithm explanation and replaced with clean problem description:
- **Before:** 600+ lines of algorithm explanation with code examples
- **After:** Clean problem description with constraints and examples only

New description:
```
Given two integers `a` and `b`, return the **sum of the two integers** without using the operators `+` and `-`.

**Example 1:**
- Input: a = 1, b = 2
- Output: 3

**Example 2:**
- Input: a = 2, b = 3  
- Output: 5

**Example 3:**
- Input: a = 0, b = 0
- Output: 0

**Constraints:**
- -1000 <= a, b <= 1000
```

---

## Bug 3: Match Not Showing in History After Forfeit ❌ → ✅

### Issue
When a user forfeited a match, it wasn't appearing in the match history dashboard.

### Root Cause
The match creation in `concludeMatch()` was failing silently because:
1. Transaction errors were caught but not re-thrown
2. Some matches didn't have `player1Id` and `player2Id` properly populated
3. The player data might not have been fully initialized

### Fix
**File:** `server/services/eloService.js`

1. Added guard to ensure both players exist with valid IDs:
   ```javascript
   if (!p1 || !p2 || !p1.id || !p2.id) {
       console.error("[ELO] Cannot conclude match: missing player data", { p1Id: p1?.id, p2Id: p2?.id });
       return;
   }
   ```

2. Made error handling throw instead of silently failing:
   ```javascript
   ]).catch(err => {
       console.error("[ELO] DB Update Error:", err);
       throw err; // Re-throw so caller knows about it
   });
   ```

---

## Testing Notes

After these fixes:
- ✅ Match history API returns 200 OK (no more 500 errors)
- ✅ Forfeited matches now properly create Match records with player IDs
- ✅ Questions display clean problem statements without algorithm spoilers
- ✅ Pagination and filtering work correctly

---

## Remaining TODO

- [ ] Audit all seeded questions for similar algorithm/spoiler content
- [ ] Add integration test for match history API
- [ ] Consider soft-deleting or archiving incomplete matches (with NULL player IDs)

