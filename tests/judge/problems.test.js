/**
 * tests/judge/problems.test.js
 *
 * Runs every problem in prisma/questions_bank/ through the judge with a
 * known-correct JavaScript reference solution, verifying that all test
 * cases (sample + hidden) pass.
 *
 * Usage:
 *   node tests/judge/problems.test.js
 *   node tests/judge/problems.test.js --filter "Two Sum"
 *   node tests/judge/problems.test.js --category arrays_strings
 *
 * Each problem entry below contains:
 *   title    - must match the JSON title exactly (used for lookup)
 *   solution - valid JS function body (function solution(...) { ... })
 *
 * The harness loads the JSON file, builds the question object the judge
 * expects (sampleTests + hiddenTests split), submits the solution, and
 * asserts allTestsPassed === true.
 */

"use strict";

const path = require("path");
const fs = require("fs");
const { executeCode } = require("../../server/services/judgeService");

// ─── helpers ──────────────────────────────────────────────────────────────────

const BANK_DIR = path.join(__dirname, "../../prisma/questions_bank");

function walkJsonFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkJsonFiles(full));
    else if (entry.name.endsWith(".json")) results.push(full);
  }
  return results;
}

/** Build the question shape that judgeService.executeCode() expects */
function buildQuestion(q) {
  return {
    title: q.title,
    difficulty: q.difficulty,
    args: q.args,
    returnType: q.returnType,
    sampleTests: (q.tests || [])
      .filter((t) => t.isSample === true)
      .map(({ isSample, ...rest }) => rest),
    hiddenTests: (q.tests || [])
      .filter((t) => t.isSample === false)
      .map(({ isSample, ...rest }) => rest),
  };
}

// ─── reference solutions ──────────────────────────────────────────────────────
// Each key is the exact problem title.  Solutions must be valid JS accepted by
// judgeService (function named `solution`).

const SOLUTIONS = {
  // ── arrays / strings ────────────────────────────────────────────────────────
  "Two Sum": `
function solution(nums, target) {
  const map = {};
  for (let i = 0; i < nums.length; i++) {
    const c = target - nums[i];
    if (map[c] !== undefined) return [map[c], i];
    map[nums[i]] = i;
  }
  return [];
}`,

  "Best Time to Buy and Sell Stock": `
function solution(prices) {
  let min = Infinity, best = 0;
  for (const p of prices) {
    best = Math.max(best, p - min);
    min = Math.min(min, p);
  }
  return best;
}`,

  "Longest Substring Without Repeating Characters": `
function solution(s) {
  const seen = {};
  let left = 0, best = 0;
  for (let r = 0; r < s.length; r++) {
    if (seen[s[r]] >= left) left = seen[s[r]] + 1;
    seen[s[r]] = r;
    best = Math.max(best, r - left + 1);
  }
  return best;
}`,

  "Container With Most Water": `
function solution(height) {
  let l = 0, r = height.length - 1, best = 0;
  while (l < r) {
    best = Math.max(best, Math.min(height[l], height[r]) * (r - l));
    if (height[l] < height[r]) l++; else r--;
  }
  return best;
}`,

  "Trapping Rain Water": `
function solution(height) {
  let l = 0, r = height.length - 1, lMax = 0, rMax = 0, water = 0;
  while (l < r) {
    if (height[l] < height[r]) {
      if (height[l] >= lMax) lMax = height[l]; else water += lMax - height[l];
      l++;
    } else {
      if (height[r] >= rMax) rMax = height[r]; else water += rMax - height[r];
      r--;
    }
  }
  return water;
}`,

  // ── backtracking / recursion ─────────────────────────────────────────────────
  Subsets: `
function solution(nums) {
  const res = [];
  function bt(start, cur) {
    res.push([...cur]);
    for (let i = start; i < nums.length; i++) {
      cur.push(nums[i]);
      bt(i + 1, cur);
      cur.pop();
    }
  }
  bt(0, []);
  return res;
}`,

  Permutations: `
function solution(nums) {
  const res = [];
  function bt(cur, used) {
    if (cur.length === nums.length) { res.push([...cur]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true; cur.push(nums[i]);
      bt(cur, used);
      cur.pop(); used[i] = false;
    }
  }
  bt([], {});
  return res;
}`,

  "Combination Sum": `
function solution(candidates, target) {
  const res = [];
  candidates.sort((a, b) => a - b);
  function bt(start, remaining, cur) {
    if (remaining === 0) { res.push([...cur]); return; }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > remaining) break;
      cur.push(candidates[i]);
      bt(i, remaining - candidates[i], cur);
      cur.pop();
    }
  }
  bt(0, target, []);
  return res;
}`,

  "N-Queens Count": `
function solution(n) {
  let count = 0;
  const cols = new Set(), d1 = new Set(), d2 = new Set();
  function bt(row) {
    if (row === n) { count++; return; }
    for (let col = 0; col < n; col++) {
      if (cols.has(col) || d1.has(row - col) || d2.has(row + col)) continue;
      cols.add(col); d1.add(row - col); d2.add(row + col);
      bt(row + 1);
      cols.delete(col); d1.delete(row - col); d2.delete(row + col);
    }
  }
  bt(0);
  return count;
}`,

  "Word Search": `
function solution(board, word) {
  const R = board.length, C = board[0].length;
  function dfs(r, c, k) {
    if (k === word.length) return true;
    if (r < 0 || r >= R || c < 0 || c >= C || board[r][c] !== word[k]) return false;
    const tmp = board[r][c];
    board[r][c] = '#';
    const found = dfs(r+1,c,k+1)||dfs(r-1,c,k+1)||dfs(r,c+1,k+1)||dfs(r,c-1,k+1);
    board[r][c] = tmp;
    return found;
  }
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (dfs(r, c, 0)) return true;
  return false;
}`,

  // ── binary search / heaps ────────────────────────────────────────────────────
  "Binary Search": `
function solution(nums, target) {
  let l = 0, r = nums.length - 1;
  while (l <= r) {
    const m = (l + r) >> 1;
    if (nums[m] === target) return m;
    if (nums[m] < target) l = m + 1; else r = m - 1;
  }
  return -1;
}`,

  "Search Insert Position": `
function solution(nums, target) {
  let l = 0, r = nums.length;
  while (l < r) {
    const m = (l + r) >> 1;
    if (nums[m] < target) l = m + 1; else r = m;
  }
  return l;
}`,

  "Find Minimum in Rotated Sorted Array": `
function solution(nums) {
  let l = 0, r = nums.length - 1;
  while (l < r) {
    const m = (l + r) >> 1;
    if (nums[m] > nums[r]) l = m + 1; else r = m;
  }
  return nums[l];
}`,

  "Kth Largest Element in an Array": `
function solution(nums, k) {
  nums.sort((a, b) => b - a);
  return nums[k - 1];
}`,

  "Median of Two Sorted Arrays": `
function solution(nums1, nums2) {
  const merged = [...nums1, ...nums2].sort((a, b) => a - b);
  const n = merged.length;
  return n % 2 === 1
    ? merged[Math.floor(n / 2)]
    : Math.floor((merged[n/2 - 1] + merged[n/2]) / 2);
}`,

  // ── bit manipulation / math ──────────────────────────────────────────────────
  "Single Number": `
function solution(nums) {
  return nums.reduce((a, b) => a ^ b, 0);
}`,

  "Reverse Bits": `
function solution(n) {
  let result = 0;
  for (let i = 0; i < 32; i++) {
    result = (result * 2) + (n & 1);
    n = Math.floor(n / 2);
  }
  return result >>> 0;
}`,

  "Counting Bits": `
function solution(n) {
  const res = [];
  for (let i = 0; i <= n; i++) {
    let x = i, c = 0;
    while (x) { c += x & 1; x >>= 1; }
    res.push(c);
  }
  return res;
}`,

  "Power of Two": `
function solution(n) {
  return n > 0 && (n & (n - 1)) === 0;
}`,

  "Sum of Two Integers": `
function solution(a, b) {
  while (b !== 0) {
    const carry = (a & b) << 1;
    a = a ^ b;
    b = carry;
  }
  return a;
}`,

  // ── dynamic programming ──────────────────────────────────────────────────────
  "Climbing Stairs": `
function solution(n) {
  let a = 1, b = 1;
  for (let i = 2; i <= n; i++) { const t = a + b; a = b; b = t; }
  return b;
}`,

  "House Robber": `
function solution(nums) {
  let prev2 = 0, prev1 = 0;
  for (const n of nums) {
    const cur = Math.max(prev1, prev2 + n);
    prev2 = prev1; prev1 = cur;
  }
  return prev1;
}`,

  "Coin Change": `
function solution(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (const c of coins)
    for (let i = c; i <= amount; i++)
      dp[i] = Math.min(dp[i], dp[i - c] + 1);
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,

  "Longest Common Subsequence": `
function solution(text1, text2) {
  const m = text1.length, n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = text1[i-1] === text2[j-1]
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1]);
  return dp[m][n];
}`,

  "Edit Distance": `
function solution(word1, word2) {
  const m = word1.length, n = word2.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i + j));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = word1[i-1] === word2[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}`,

  // ── linked lists (represented as arrays) ─────────────────────────────────────
  "Reverse Linked List": `
function solution(nodes) {
  return nodes.reverse();
}`,

  "Middle of the Linked List": `
function solution(nodes) {
  const mid = Math.floor(nodes.length / 2);
  return nodes.slice(mid);
}`,

  "Merge Two Sorted Lists": `
function solution(l1, l2) {
  const res = [];
  let i = 0, j = 0;
  while (i < l1.length && j < l2.length) {
    if (l1[i] <= l2[j]) res.push(l1[i++]); else res.push(l2[j++]);
  }
  while (i < l1.length) res.push(l1[i++]);
  while (j < l2.length) res.push(l2[j++]);
  return res;
}`,

  "Remove Nth Node From End of List": `
function solution(nodes, n) {
  const idx = nodes.length - n;
  return [...nodes.slice(0, idx), ...nodes.slice(idx + 1)];
}`,

  "Reorder List": `
function solution(nodes) {
  const res = [];
  let l = 0, r = nodes.length - 1;
  let turn = true;
  while (l <= r) {
    if (turn) res.push(nodes[l++]); else res.push(nodes[r--]);
    turn = !turn;
  }
  return res;
}`,

  // ── stacks / queues ──────────────────────────────────────────────────────────
  "Valid Parentheses": `
function solution(s) {
  const map = { ')': '(', '}': '{', ']': '[' };
  const stack = [];
  for (const c of s) {
    if ('([{'.includes(c)) stack.push(c);
    else if (stack.pop() !== map[c]) return false;
  }
  return stack.length === 0;
}`,

  "Baseball Game": `
function solution(ops) {
  const stack = [];
  for (const op of ops) {
    if (op === '+') stack.push(stack[stack.length-1] + stack[stack.length-2]);
    else if (op === 'D') stack.push(stack[stack.length-1] * 2);
    else if (op === 'C') stack.pop();
    else stack.push(Number(op));
  }
  return stack.reduce((a, b) => a + b, 0);
}`,

  "Evaluate Reverse Polish Notation": `
function solution(tokens) {
  const stack = [];
  for (const t of tokens) {
    if ('+-*/'.includes(t)) {
      const b = stack.pop(), a = stack.pop();
      if (t === '+') stack.push(a + b);
      else if (t === '-') stack.push(a - b);
      else if (t === '*') stack.push(a * b);
      else stack.push(Math.trunc(a / b));
    } else stack.push(Number(t));
  }
  return stack[0];
}`,

  "Daily Temperatures": `
function solution(temperatures) {
  const res = Array(temperatures.length).fill(0);
  const stack = [];
  for (let i = 0; i < temperatures.length; i++) {
    while (stack.length && temperatures[i] > temperatures[stack[stack.length-1]]) {
      const idx = stack.pop();
      res[idx] = i - idx;
    }
    stack.push(i);
  }
  return res;
}`,

  "Largest Rectangle in Histogram": `
function solution(heights) {
  const stack = [-1];
  let max = 0;
  for (let i = 0; i < heights.length; i++) {
    while (stack[stack.length-1] !== -1 && heights[stack[stack.length-1]] >= heights[i]) {
      const h = heights[stack.pop()];
      const w = i - stack[stack.length-1] - 1;
      max = Math.max(max, h * w);
    }
    stack.push(i);
  }
  while (stack[stack.length-1] !== -1) {
    const h = heights[stack.pop()];
    const w = heights.length - stack[stack.length-1] - 1;
    max = Math.max(max, h * w);
  }
  return max;
}`,

  // ── trees / graphs ────────────────────────────────────────────────────────────
  // NOTE: trees are passed as BFS-level arrays where -1 means null.

  "Maximum Depth of Binary Tree": `
function solution(nodes) {
  if (!nodes || nodes.length === 0) return 0;
  // Build tree from level-order array and compute depth via BFS
  // nodes[0] is root; children of nodes[i] are nodes[2i+1] and nodes[2i+2]
  function depth(i) {
    if (i >= nodes.length || nodes[i] === -1 || nodes[i] === null) return 0;
    return 1 + Math.max(depth(2*i+1), depth(2*i+2));
  }
  return depth(0);
}`,

  "Invert Binary Tree": `
function solution(nodes) {
  if (!nodes || nodes.length === 0) return [];
  if (nodes[0] === -1 || nodes[0] === null) return [];
  // Decode standard LeetCode BFS array (queue-based, -1 = null)
  const root = { val: nodes[0], left: null, right: null };
  const queue = [root];
  let i = 1;
  while (queue.length && i < nodes.length) {
    const node = queue.shift();
    if (i < nodes.length) {
      if (nodes[i] !== -1 && nodes[i] !== null) {
        node.left = { val: nodes[i], left: null, right: null };
        queue.push(node.left);
      }
      i++;
    }
    if (i < nodes.length) {
      if (nodes[i] !== -1 && nodes[i] !== null) {
        node.right = { val: nodes[i], left: null, right: null };
        queue.push(node.right);
      }
      i++;
    }
  }
  // Invert
  function inv(node) {
    if (!node) return;
    [node.left, node.right] = [node.right, node.left];
    inv(node.left); inv(node.right);
  }
  inv(root);
  // BFS serialize — emit -1 for null nodes only when the level has real nodes
  const result = [];
  let level = [root];
  while (level.length) {
    const nextLevel = [];
    let hasReal = false;
    for (const node of level) {
      if (node) { result.push(node.val); nextLevel.push(node.left, node.right); hasReal = true; }
      else result.push(-1);
    }
    if (!hasReal) { for (let k = 0; k < level.length; k++) result.pop(); break; }
    if (!nextLevel.some(n => n !== null && n !== undefined)) break;
    level = nextLevel;
  }
  return result;
}`,

  "Number of Islands": `
function solution(grid) {
  let count = 0;
  const R = grid.length, C = grid[0].length;
  function dfs(r, c) {
    if (r < 0 || r >= R || c < 0 || c >= C || grid[r][c] !== 1) return;
    grid[r][c] = 0;
    dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1);
  }
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (grid[r][c] === 1) { dfs(r, c); count++; }
  return count;
}`,

  "Binary Tree Level Order Traversal": `
function solution(nodes) {
  if (!nodes || nodes.length === 0 || nodes[0] === -1) return [];
  const result = [];
  let levelStart = 0, levelSize = 1;
  while (levelStart < nodes.length) {
    const level = [];
    for (let i = levelStart; i < levelStart + levelSize && i < nodes.length; i++) {
      if (nodes[i] !== -1 && nodes[i] !== null) level.push(nodes[i]);
    }
    if (level.length > 0) result.push(level);
    levelStart += levelSize;
    levelSize *= 2;
  }
  return result;
}`,

  "Course Schedule": `
function solution(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []);
  for (const [a, b] of prerequisites) adj[b].push(a);
  const visited = Array(numCourses).fill(0);
  function hasCycle(node) {
    if (visited[node] === 1) return true;
    if (visited[node] === 2) return false;
    visited[node] = 1;
    for (const nb of adj[node]) if (hasCycle(nb)) return true;
    visited[node] = 2;
    return false;
  }
  for (let i = 0; i < numCourses; i++) if (hasCycle(i)) return false;
  return true;
}`,
};

// ─── test runner ──────────────────────────────────────────────────────────────

const LANG = "javascript";

async function runAll(filterTitle, filterCategory) {
  const files = walkJsonFiles(BANK_DIR);

  let passed = 0, failed = 0, skipped = 0;
  const failures = [];

  for (const file of files) {
    const category = path.basename(path.dirname(file));
    const q = JSON.parse(fs.readFileSync(file, "utf8"));
    const title = q.title;

    if (filterTitle && !title.toLowerCase().includes(filterTitle.toLowerCase())) {
      skipped++;
      continue;
    }
    if (filterCategory && category !== filterCategory) {
      skipped++;
      continue;
    }

    const solution = SOLUTIONS[title];
    if (!solution) {
      console.log(`  SKIP  [no solution]  ${title}`);
      skipped++;
      continue;
    }

    const question = buildQuestion(q);
    const totalTests =
      question.sampleTests.length + question.hiddenTests.length;

    let result;
    try {
      result = await executeCode(solution, LANG, question);
    } catch (err) {
      console.log(`  ERROR [${category}] ${title}: ${err.message}`);
      failures.push({ title, category, reason: err.message });
      failed++;
      continue;
    }

    if (result.allTestsPassed) {
      console.log(
        `  PASS  [${category.padEnd(28)}] ${title.padEnd(45)} ${result.ratio || totalTests + "/" + totalTests}`
      );
      passed++;
    } else {
      const msg = result.failedMessage
        ? result.failedMessage.slice(0, 160)
        : "unknown failure";
      console.log(
        `  FAIL  [${category.padEnd(28)}] ${title.padEnd(45)} ${result.ratio || "?/?"}  — ${msg}`
      );
      failures.push({ title, category, reason: msg, ratio: result.ratio });
      failed++;
    }
  }

  console.log("\n" + "─".repeat(80));
  console.log(
    `Results: ${passed} passed, ${failed} failed, ${skipped} skipped  (${passed + failed + skipped} total)`
  );

  if (failures.length > 0) {
    console.log("\nFailed problems:");
    for (const f of failures) {
      console.log(`  • [${f.category}] ${f.title}${f.ratio ? " (" + f.ratio + ")" : ""}`);
      console.log(`      ${f.reason}`);
    }
    process.exitCode = 1;
  }
}

// ─── CLI entry ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let filterTitle, filterCategory;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--filter" && args[i + 1]) filterTitle = args[++i];
  if (args[i] === "--category" && args[i + 1]) filterCategory = args[++i];
}

console.log("Running problem judge tests...\n");
runAll(filterTitle, filterCategory).catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
