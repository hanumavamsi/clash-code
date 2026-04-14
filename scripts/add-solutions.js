/**
 * add-solutions.js
 *
 * Directly patches the DB with JavaScript solutions for all questions.
 * Uses upsert-by-title (matches on title, updates solution field only).
 * Safe to run multiple times — idempotent.
 *
 * Usage:
 *   node scripts/add-solutions.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Solutions keyed by exact question title (matches DB titles)
const SOLUTIONS = {
  // ─── Arrays & Strings ─────────────────────────────────────────────────────
  "Two Sum": `function solution(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    if (map.has(comp)) return [map.get(comp), i];
    map.set(nums[i], i);
  }
  return [];
}`,

  "Best Time to Buy and Sell Stock": `function solution(prices) {
  let minPrice = Infinity, maxProfit = 0;
  for (const p of prices) {
    minPrice = Math.min(minPrice, p);
    maxProfit = Math.max(maxProfit, p - minPrice);
  }
  return maxProfit;
}`,

  "Maximum Subarray": `function solution(nums) {
  let maxSum = nums[0], cur = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    maxSum = Math.max(maxSum, cur);
  }
  return maxSum;
}`,

  "Container With Most Water": `function solution(height) {
  let l = 0, r = height.length - 1, max = 0;
  while (l < r) {
    max = Math.max(max, Math.min(height[l], height[r]) * (r - l));
    if (height[l] < height[r]) l++; else r--;
  }
  return max;
}`,

  "Trapping Rain Water": `function solution(height) {
  let l = 0, r = height.length - 1, lMax = 0, rMax = 0, water = 0;
  while (l < r) {
    if (height[l] < height[r]) {
      lMax = Math.max(lMax, height[l]);
      water += lMax - height[l++];
    } else {
      rMax = Math.max(rMax, height[r]);
      water += rMax - height[r--];
    }
  }
  return water;
}`,

  "3Sum": `function solution(nums) {
  nums.sort((a, b) => a - b);
  const res = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i-1]) continue;
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const s = nums[i] + nums[l] + nums[r];
      if (s === 0) {
        res.push([nums[i], nums[l], nums[r]]);
        while (l < r && nums[l] === nums[l+1]) l++;
        while (l < r && nums[r] === nums[r-1]) r--;
        l++; r--;
      } else if (s < 0) l++;
      else r--;
    }
  }
  return res;
}`,

  "4Sum": `function solution(nums, target) {
  nums.sort((a, b) => a - b);
  const res = [];
  for (let i = 0; i < nums.length - 3; i++) {
    if (i > 0 && nums[i] === nums[i-1]) continue;
    for (let j = i + 1; j < nums.length - 2; j++) {
      if (j > i + 1 && nums[j] === nums[j-1]) continue;
      let l = j + 1, r = nums.length - 1;
      while (l < r) {
        const s = nums[i] + nums[j] + nums[l] + nums[r];
        if (s === target) {
          res.push([nums[i], nums[j], nums[l], nums[r]]);
          while (l < r && nums[l] === nums[l+1]) l++;
          while (l < r && nums[r] === nums[r-1]) r--;
          l++; r--;
        } else if (s < target) l++;
        else r--;
      }
    }
  }
  return res;
}`,

  "Longest Substring Without Repeating Characters": `function solution(s) {
  const map = new Map();
  let max = 0, l = 0;
  for (let r = 0; r < s.length; r++) {
    if (map.has(s[r])) l = Math.max(l, map.get(s[r]) + 1);
    map.set(s[r], r);
    max = Math.max(max, r - l + 1);
  }
  return max;
}`,

  "Longest Substring Without Repeating": `function solution(s) {
  const map = new Map();
  let max = 0, l = 0;
  for (let r = 0; r < s.length; r++) {
    if (map.has(s[r])) l = Math.max(l, map.get(s[r]) + 1);
    map.set(s[r], r);
    max = Math.max(max, r - l + 1);
  }
  return max;
}`,

  "Minimum Window Substring": `function solution(s, t) {
  const need = new Map();
  for (const c of t) need.set(c, (need.get(c) || 0) + 1);
  let have = 0, required = need.size, l = 0, min = Infinity, res = "";
  const window = new Map();
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    window.set(c, (window.get(c) || 0) + 1);
    if (need.has(c) && window.get(c) === need.get(c)) have++;
    while (have === required) {
      if (r - l + 1 < min) { min = r - l + 1; res = s.slice(l, r + 1); }
      const lc = s[l++];
      window.set(lc, window.get(lc) - 1);
      if (need.has(lc) && window.get(lc) < need.get(lc)) have--;
    }
  }
  return res;
}`,

  "Minimum Window Substring Length": `function solution(s, t) {
  const need = new Map();
  for (const c of t) need.set(c, (need.get(c) || 0) + 1);
  let have = 0, required = need.size, l = 0, min = Infinity;
  const window = new Map();
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    window.set(c, (window.get(c) || 0) + 1);
    if (need.has(c) && window.get(c) === need.get(c)) have++;
    while (have === required) {
      min = Math.min(min, r - l + 1);
      const lc = s[l++];
      window.set(lc, window.get(lc) - 1);
      if (need.has(lc) && window.get(lc) < need.get(lc)) have--;
    }
  }
  return min === Infinity ? 0 : min;
}`,

  "Find All Anagrams in a String": `function solution(s, p) {
  const need = new Array(26).fill(0);
  const win = new Array(26).fill(0);
  const a = 'a'.charCodeAt(0);
  for (const c of p) need[c.charCodeAt(0) - a]++;
  const res = [];
  for (let r = 0; r < s.length; r++) {
    win[s.charCodeAt(r) - a]++;
    if (r >= p.length) win[s.charCodeAt(r - p.length) - a]--;
    if (win.join() === need.join()) res.push(r - p.length + 1);
  }
  return res;
}`,

  "Subarray Sum Equals K": `function solution(nums, k) {
  const map = new Map([[0, 1]]);
  let sum = 0, count = 0;
  for (const n of nums) {
    sum += n;
    count += (map.get(sum - k) || 0);
    map.set(sum, (map.get(sum) || 0) + 1);
  }
  return count;
}`,

  "Product of Array Except Self": `function solution(nums) {
  const n = nums.length, res = new Array(n).fill(1);
  let prefix = 1;
  for (let i = 0; i < n; i++) { res[i] = prefix; prefix *= nums[i]; }
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) { res[i] *= suffix; suffix *= nums[i]; }
  return res;
}`,

  "Merge Intervals": `function solution(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const res = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = res[res.length - 1];
    if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);
    else res.push(intervals[i]);
  }
  return res;
}`,

  "Spiral Matrix": `function solution(matrix) {
  const res = [];
  let top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) res.push(matrix[top][c]); top++;
    for (let r = top; r <= bottom; r++) res.push(matrix[r][right]); right--;
    if (top <= bottom) { for (let c = right; c >= left; c--) res.push(matrix[bottom][c]); bottom--; }
    if (left <= right) { for (let r = bottom; r >= top; r--) res.push(matrix[r][left]); left++; }
  }
  return res;
}`,

  "Set Matrix Zeroes": `function solution(matrix) {
  const rows = new Set(), cols = new Set();
  for (let r = 0; r < matrix.length; r++)
    for (let c = 0; c < matrix[0].length; c++)
      if (matrix[r][c] === 0) { rows.add(r); cols.add(c); }
  for (let r = 0; r < matrix.length; r++)
    for (let c = 0; c < matrix[0].length; c++)
      if (rows.has(r) || cols.has(c)) matrix[r][c] = 0;
  return matrix;
}`,

  "Rotate Array": `function solution(nums, k) {
  k = k % nums.length;
  const reverse = (l, r) => { while (l < r) { [nums[l], nums[r]] = [nums[r], nums[l]]; l++; r--; } };
  reverse(0, nums.length - 1);
  reverse(0, k - 1);
  reverse(k, nums.length - 1);
  return nums;
}`,

  "Valid Anagram": `function solution(s, t) {
  if (s.length !== t.length) return false;
  const count = new Array(26).fill(0);
  const a = 'a'.charCodeAt(0);
  for (let i = 0; i < s.length; i++) {
    count[s.charCodeAt(i) - a]++;
    count[t.charCodeAt(i) - a]--;
  }
  return count.every(c => c === 0);
}`,

  "Group Anagrams": `function solution(strs) {
  const map = new Map();
  for (const s of strs) {
    const key = s.split('').sort().join('');
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  }
  return [...map.values()];
}`,

  "Longest Consecutive Sequence": `function solution(nums) {
  const set = new Set(nums);
  let max = 0;
  for (const n of set) {
    if (!set.has(n - 1)) {
      let cur = n, len = 1;
      while (set.has(cur + 1)) { cur++; len++; }
      max = Math.max(max, len);
    }
  }
  return max;
}`,

  "Maximum Product Subarray": `function solution(nums) {
  let max = nums[0], min = nums[0], res = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const candidates = [nums[i], max * nums[i], min * nums[i]];
    max = Math.max(...candidates);
    min = Math.min(...candidates);
    res = Math.max(res, max);
  }
  return res;
}`,

  "Maximum Product Subarray DP": `function solution(nums) {
  let max = nums[0], min = nums[0], res = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const candidates = [nums[i], max * nums[i], min * nums[i]];
    max = Math.max(...candidates);
    min = Math.min(...candidates);
    res = Math.max(res, max);
  }
  return res;
}`,

  "Next Permutation": `function solution(nums) {
  let i = nums.length - 2;
  while (i >= 0 && nums[i] >= nums[i + 1]) i--;
  if (i >= 0) {
    let j = nums.length - 1;
    while (nums[j] <= nums[i]) j--;
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  let l = i + 1, r = nums.length - 1;
  while (l < r) { [nums[l], nums[r]] = [nums[r], nums[l]]; l++; r--; }
  return nums;
}`,

  "Find the Duplicate Number": `function solution(nums) {
  let slow = nums[0], fast = nums[0];
  do { slow = nums[slow]; fast = nums[nums[fast]]; } while (slow !== fast);
  slow = nums[0];
  while (slow !== fast) { slow = nums[slow]; fast = nums[fast]; }
  return slow;
}`,

  "First Missing Positive": `function solution(nums) {
  const n = nums.length;
  for (let i = 0; i < n; i++)
    while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] !== nums[i])
      [nums[nums[i] - 1], nums[i]] = [nums[i], nums[nums[i] - 1]];
  for (let i = 0; i < n; i++) if (nums[i] !== i + 1) return i + 1;
  return n + 1;
}`,

  "Move Zeroes": `function solution(nums) {
  let j = 0;
  for (let i = 0; i < nums.length; i++)
    if (nums[i] !== 0) nums[j++] = nums[i];
  while (j < nums.length) nums[j++] = 0;
  return nums;
}`,

  "Word Break": `function solution(s, wordDict) {
  const set = new Set(wordDict);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++)
    for (let j = 0; j < i; j++)
      if (dp[j] && set.has(s.slice(j, i))) { dp[i] = true; break; }
  return dp[s.length];
}`,

  "Word Break Variation": `function solution(s, wordDict) {
  const set = new Set(wordDict);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++)
    for (let j = 0; j < i; j++)
      if (dp[j] && set.has(s.slice(j, i))) { dp[i] = true; break; }
  return dp[s.length];
}`,

  "Asteroid Collision": `function solution(asteroids) {
  const stack = [];
  for (const a of asteroids) {
    let alive = true;
    while (alive && a < 0 && stack.length && stack[stack.length - 1] > 0) {
      const top = stack[stack.length - 1];
      if (top < -a) stack.pop();
      else if (top === -a) { stack.pop(); alive = false; }
      else alive = false;
    }
    if (alive) stack.push(a);
  }
  return stack;
}`,

  "Majority Element II": `function solution(nums) {
  let c1 = null, c2 = null, cnt1 = 0, cnt2 = 0;
  for (const n of nums) {
    if (n === c1) cnt1++;
    else if (n === c2) cnt2++;
    else if (cnt1 === 0) { c1 = n; cnt1 = 1; }
    else if (cnt2 === 0) { c2 = n; cnt2 = 1; }
    else { cnt1--; cnt2--; }
  }
  cnt1 = cnt2 = 0;
  for (const n of nums) { if (n === c1) cnt1++; else if (n === c2) cnt2++; }
  const res = [];
  if (cnt1 > nums.length / 3) res.push(c1);
  if (cnt2 > nums.length / 3) res.push(c2);
  return res;
}`,

  "Add Binary": `function solution(a, b) {
  let i = a.length - 1, j = b.length - 1, carry = 0, res = '';
  while (i >= 0 || j >= 0 || carry) {
    const sum = (i >= 0 ? +a[i--] : 0) + (j >= 0 ? +b[j--] : 0) + carry;
    carry = Math.floor(sum / 2);
    res = (sum % 2) + res;
  }
  return res;
}`,

  "Reverse String": `function solution(s) {
  return s.split('').reverse().join('');
}`,

  "Longest Palindromic Substring": `function solution(s) {
  let res = '';
  for (let i = 0; i < s.length; i++) {
    for (const [l, r] of [[i, i], [i, i + 1]]) {
      let lo = l, hi = r;
      while (lo >= 0 && hi < s.length && s[lo] === s[hi]) { lo--; hi++; }
      if (hi - lo - 1 > res.length) res = s.slice(lo + 1, hi);
    }
  }
  return res;
}`,

  "Palindromic Substrings": `function solution(s) {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    for (const [l, r] of [[i, i], [i, i + 1]]) {
      let lo = l, hi = r;
      while (lo >= 0 && hi < s.length && s[lo] === s[hi]) { count++; lo--; hi++; }
    }
  }
  return count;
}`,

  // ─── Linked Lists ─────────────────────────────────────────────────────────
  "Reverse Linked List": `function solution(head) {
  let prev = null, cur = head;
  while (cur) { const next = cur.next; cur.next = prev; prev = cur; cur = next; }
  return prev;
}`,

  "Merge Two Sorted Lists": `function solution(l1, l2) {
  const dummy = { next: null };
  let cur = dummy;
  while (l1 && l2) {
    if (l1.val <= l2.val) { cur.next = l1; l1 = l1.next; }
    else { cur.next = l2; l2 = l2.next; }
    cur = cur.next;
  }
  cur.next = l1 || l2;
  return dummy.next;
}`,

  "Middle of the Linked List": `function solution(head) {
  let slow = head, fast = head;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  return slow;
}`,

  "Remove Nth Node From End of List": `function solution(head, n) {
  const dummy = { next: head };
  let fast = dummy, slow = dummy;
  for (let i = 0; i <= n; i++) fast = fast.next;
  while (fast) { fast = fast.next; slow = slow.next; }
  slow.next = slow.next.next;
  return dummy.next;
}`,

  "Reorder List": `function solution(head) {
  if (!head) return head;
  let slow = head, fast = head;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  let prev = null, cur = slow.next; slow.next = null;
  while (cur) { const next = cur.next; cur.next = prev; prev = cur; cur = next; }
  let first = head, second = prev;
  while (second) {
    const tmp1 = first.next, tmp2 = second.next;
    first.next = second; second.next = tmp1;
    first = tmp1; second = tmp2;
  }
  return head;
}`,

  "Linked List Cycle": `function solution(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next; fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`,

  "Linked List Cycle II": `function solution(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next; fast = fast.next.next;
    if (slow === fast) {
      slow = head;
      while (slow !== fast) { slow = slow.next; fast = fast.next; }
      return slow;
    }
  }
  return null;
}`,

  "Add Two Numbers": `function solution(l1, l2) {
  let dummy = { next: null }, cur = dummy, carry = 0;
  while (l1 || l2 || carry) {
    const sum = (l1 ? l1.val : 0) + (l2 ? l2.val : 0) + carry;
    carry = Math.floor(sum / 10);
    cur.next = { val: sum % 10, next: null };
    cur = cur.next;
    if (l1) l1 = l1.next;
    if (l2) l2 = l2.next;
  }
  return dummy.next;
}`,

  "Intersection of Two Linked Lists": `function solution(headA, headB) {
  let a = headA, b = headB;
  while (a !== b) { a = a ? a.next : headB; b = b ? b.next : headA; }
  return a;
}`,

  "Palindrome Linked List": `function solution(head) {
  const vals = [];
  let cur = head;
  while (cur) { vals.push(cur.val); cur = cur.next; }
  let l = 0, r = vals.length - 1;
  while (l < r) if (vals[l++] !== vals[r--]) return false;
  return true;
}`,

  "Copy List with Random Pointer": `function solution(head) {
  if (!head) return null;
  const map = new Map();
  let cur = head;
  while (cur) { map.set(cur, { val: cur.val, next: null, random: null }); cur = cur.next; }
  cur = head;
  while (cur) {
    map.get(cur).next = map.get(cur.next) || null;
    map.get(cur).random = map.get(cur.random) || null;
    cur = cur.next;
  }
  return map.get(head);
}`,

  "Remove Duplicates from Sorted List": `function solution(head) {
  let cur = head;
  while (cur && cur.next) {
    if (cur.val === cur.next.val) cur.next = cur.next.next;
    else cur = cur.next;
  }
  return head;
}`,

  "Remove Duplicates from Sorted List II": `function solution(head) {
  const dummy = { next: head };
  let prev = dummy;
  while (prev.next) {
    let cur = prev.next;
    while (cur.next && cur.next.val === cur.val) cur = cur.next;
    if (cur !== prev.next) prev.next = cur.next;
    else prev = prev.next;
  }
  return dummy.next;
}`,

  "Odd Even Linked List": `function solution(head) {
  if (!head) return head;
  let odd = head, even = head.next, evenHead = even;
  while (even && even.next) {
    odd.next = even.next; odd = odd.next;
    even.next = odd.next; even = even.next;
  }
  odd.next = evenHead;
  return head;
}`,

  "Swap Nodes in Pairs": `function solution(head) {
  const dummy = { next: head };
  let prev = dummy;
  while (prev.next && prev.next.next) {
    const a = prev.next, b = prev.next.next;
    prev.next = b; a.next = b.next; b.next = a;
    prev = a;
  }
  return dummy.next;
}`,

  "Rotating List": `function solution(head, k) {
  if (!head) return head;
  let len = 1, tail = head;
  while (tail.next) { tail = tail.next; len++; }
  k = k % len;
  if (k === 0) return head;
  tail.next = head;
  let cur = head;
  for (let i = 0; i < len - k - 1; i++) cur = cur.next;
  const newHead = cur.next;
  cur.next = null;
  return newHead;
}`,

  "Partition List": `function solution(head, x) {
  const less = { next: null }, greater = { next: null };
  let l = less, g = greater, cur = head;
  while (cur) {
    if (cur.val < x) { l.next = cur; l = l.next; }
    else { g.next = cur; g = g.next; }
    cur = cur.next;
  }
  g.next = null; l.next = greater.next;
  return less.next;
}`,

  "Delete Node in a Linked List": `function solution(node) {
  node.val = node.next.val;
  node.next = node.next.next;
}`,

  "Split Linked List in Parts": `function solution(head, k) {
  let len = 0, cur = head;
  while (cur) { len++; cur = cur.next; }
  const baseSize = Math.floor(len / k), extra = len % k;
  const res = [];
  cur = head;
  for (let i = 0; i < k; i++) {
    res.push(cur);
    const size = baseSize + (i < extra ? 1 : 0);
    for (let j = 0; j < size - 1; j++) cur = cur.next;
    if (cur) { const next = cur.next; cur.next = null; cur = next; }
  }
  return res;
}`,

  "Flatten Multilevel Doubly Linked List": `function solution(head) {
  if (!head) return head;
  let cur = head;
  while (cur) {
    if (cur.child) {
      const child = cur.child, next = cur.next;
      cur.next = child; child.prev = cur; cur.child = null;
      let tail = child;
      while (tail.next) tail = tail.next;
      tail.next = next; if (next) next.prev = tail;
    }
    cur = cur.next;
  }
  return head;
}`,

  "Insert into a Sorted Circular Linked List": `function solution(head, insertVal) {
  const node = { val: insertVal, next: null };
  if (!head) { node.next = node; return node; }
  let cur = head;
  while (true) {
    if (cur.val <= insertVal && insertVal <= cur.next.val) break;
    if (cur.val > cur.next.val && (insertVal >= cur.val || insertVal <= cur.next.val)) break;
    if (cur.next === head) break;
    cur = cur.next;
  }
  node.next = cur.next; cur.next = node;
  return head;
}`,

  // ─── Stacks & Queues ──────────────────────────────────────────────────────
  "Valid Parentheses": `function solution(s) {
  const stack = [], map = { ')': '(', ']': '[', '}': '{' };
  for (const c of s) {
    if ('([{'.includes(c)) stack.push(c);
    else if (stack.pop() !== map[c]) return false;
  }
  return stack.length === 0;
}`,

  "Daily Temperatures": `function solution(temperatures) {
  const res = new Array(temperatures.length).fill(0);
  const stack = [];
  for (let i = 0; i < temperatures.length; i++) {
    while (stack.length && temperatures[i] > temperatures[stack[stack.length - 1]]) {
      const j = stack.pop();
      res[j] = i - j;
    }
    stack.push(i);
  }
  return res;
}`,

  "Evaluate Reverse Polish Notation": `function solution(tokens) {
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

  "Largest Rectangle in Histogram": `function solution(heights) {
  const stack = [], n = heights.length;
  let max = 0;
  for (let i = 0; i <= n; i++) {
    const h = i === n ? 0 : heights[i];
    while (stack.length && heights[stack[stack.length - 1]] > h) {
      const height = heights[stack.pop()];
      const width = stack.length ? i - stack[stack.length - 1] - 1 : i;
      max = Math.max(max, height * width);
    }
    stack.push(i);
  }
  return max;
}`,

  "Baseball Game": `function solution(ops) {
  const stack = [];
  for (const op of ops) {
    if (op === '+') stack.push(stack[stack.length - 1] + stack[stack.length - 2]);
    else if (op === 'D') stack.push(stack[stack.length - 1] * 2);
    else if (op === 'C') stack.pop();
    else stack.push(Number(op));
  }
  return stack.reduce((a, b) => a + b, 0);
}`,

  "Min Stack": `function solution() {
  const stack = [], minStack = [];
  return {
    push(val) { stack.push(val); minStack.push(Math.min(val, minStack.length ? minStack[minStack.length - 1] : val)); },
    pop() { stack.pop(); minStack.pop(); },
    top() { return stack[stack.length - 1]; },
    getMin() { return minStack[minStack.length - 1]; }
  };
}`,

  "Min Stack Tracker": `function solution() {
  const stack = [], minStack = [];
  return {
    push(val) { stack.push(val); minStack.push(Math.min(val, minStack.length ? minStack[minStack.length - 1] : val)); },
    pop() { stack.pop(); minStack.pop(); },
    top() { return stack[stack.length - 1]; },
    getMin() { return minStack[minStack.length - 1]; }
  };
}`,

  "Implement Queue using Stacks": `function solution() {
  const inbox = [], outbox = [];
  return {
    push(x) { inbox.push(x); },
    pop() { if (!outbox.length) while (inbox.length) outbox.push(inbox.pop()); return outbox.pop(); },
    peek() { if (!outbox.length) while (inbox.length) outbox.push(inbox.pop()); return outbox[outbox.length - 1]; },
    empty() { return !inbox.length && !outbox.length; }
  };
}`,

  "Implement Stack using Queues": `function solution() {
  const q = [];
  return {
    push(x) { q.push(x); for (let i = 0; i < q.length - 1; i++) q.push(q.shift()); },
    pop() { return q.shift(); },
    top() { return q[0]; },
    empty() { return q.length === 0; }
  };
}`,

  "Next Greater Element I": `function solution(nums1, nums2) {
  const map = new Map(), stack = [];
  for (const n of nums2) {
    while (stack.length && stack[stack.length - 1] < n) map.set(stack.pop(), n);
    stack.push(n);
  }
  return nums1.map(n => map.get(n) ?? -1);
}`,

  "Next Greater Element II": `function solution(nums) {
  const n = nums.length, res = new Array(n).fill(-1), stack = [];
  for (let i = 0; i < 2 * n; i++) {
    while (stack.length && nums[stack[stack.length - 1]] < nums[i % n])
      res[stack.pop()] = nums[i % n];
    if (i < n) stack.push(i);
  }
  return res;
}`,

  "Sliding Window Maximum": `function solution(nums, k) {
  const deque = [], res = [];
  for (let i = 0; i < nums.length; i++) {
    while (deque.length && deque[0] < i - k + 1) deque.shift();
    while (deque.length && nums[deque[deque.length - 1]] < nums[i]) deque.pop();
    deque.push(i);
    if (i >= k - 1) res.push(nums[deque[0]]);
  }
  return res;
}`,

  "Longest Valid Parentheses": `function solution(s) {
  const stack = [-1];
  let max = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') stack.push(i);
    else {
      stack.pop();
      if (!stack.length) stack.push(i);
      else max = Math.max(max, i - stack[stack.length - 1]);
    }
  }
  return max;
}`,

  "Online Stock Span": `function solution() {
  const stack = [];
  return {
    next(price) {
      let span = 1;
      while (stack.length && stack[stack.length - 1][0] <= price) span += stack.pop()[1];
      stack.push([price, span]);
      return span;
    }
  };
}`,

  "Decode String": `function solution(s) {
  const stack = [];
  let cur = '', k = 0;
  for (const c of s) {
    if (c >= '0' && c <= '9') k = k * 10 + +c;
    else if (c === '[') { stack.push([cur, k]); cur = ''; k = 0; }
    else if (c === ']') { const [prev, times] = stack.pop(); cur = prev + cur.repeat(times); }
    else cur += c;
  }
  return cur;
}`,

  "Validate Stack Sequences": `function solution(pushed, popped) {
  const stack = [];
  let j = 0;
  for (const n of pushed) {
    stack.push(n);
    while (stack.length && stack[stack.length - 1] === popped[j]) { stack.pop(); j++; }
  }
  return stack.length === 0;
}`,

  "Remove K Digits": `function solution(num, k) {
  const stack = [];
  for (const d of num) {
    while (k > 0 && stack.length && stack[stack.length - 1] > d) { stack.pop(); k--; }
    stack.push(d);
  }
  while (k > 0) { stack.pop(); k--; }
  const res = stack.join('').replace(/^0+/, '') || '0';
  return res;
}`,

  "Simplify Unix Path": `function solution(path) {
  const parts = path.split('/'), stack = [];
  for (const p of parts) {
    if (p === '..') stack.pop();
    else if (p && p !== '.') stack.push(p);
  }
  return '/' + stack.join('/');
}`,

  "Exclusive Time of Functions": `function solution(n, logs) {
  const res = new Array(n).fill(0), stack = [];
  let prev = 0;
  for (const log of logs) {
    const [id, type, time] = log.split(':');
    const t = +time;
    if (stack.length) res[stack[stack.length - 1]] += t - prev;
    prev = t;
    if (type === 'start') stack.push(+id);
    else { res[stack.pop()]++; prev++; }
  }
  return res;
}`,

  "Moving Average from Data Stream": `function solution(size) {
  const q = [];
  let sum = 0;
  return {
    next(val) {
      q.push(val); sum += val;
      if (q.length > size) sum -= q.shift();
      return sum / q.length;
    }
  };
}`,

  "Shortest Subarray with Sum at Least K": `function solution(nums, k) {
  const n = nums.length, prefix = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + nums[i];
  const deque = [];
  let res = Infinity;
  for (let i = 0; i <= n; i++) {
    while (deque.length && prefix[i] - prefix[deque[0]] >= k)
      res = Math.min(res, i - deque.shift());
    while (deque.length && prefix[deque[deque.length - 1]] >= prefix[i])
      deque.pop();
    deque.push(i);
  }
  return res === Infinity ? -1 : res;
}`,

  // ─── Trees & Graphs ───────────────────────────────────────────────────────
  "Maximum Depth of Binary Tree": `function solution(root) {
  if (!root) return 0;
  return 1 + Math.max(solution(root.left), solution(root.right));
}`,

  "Invert Binary Tree": `function solution(root) {
  if (!root) return null;
  [root.left, root.right] = [solution(root.right), solution(root.left)];
  return root;
}`,

  "Binary Tree Level Order Traversal": `function solution(root) {
  if (!root) return [];
  const res = [], queue = [root];
  while (queue.length) {
    const level = [], size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    res.push(level);
  }
  return res;
}`,

  "Number of Islands": `function solution(grid) {
  let count = 0;
  function dfs(r, c) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] !== '1') return;
    grid[r][c] = '0';
    dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1);
  }
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[0].length; c++)
      if (grid[r][c] === '1') { dfs(r, c); count++; }
  return count;
}`,

  "Course Schedule": `function solution(numCourses, prerequisites) {
  const graph = Array.from({ length: numCourses }, () => []);
  for (const [a, b] of prerequisites) graph[b].push(a);
  const state = new Array(numCourses).fill(0);
  function dfs(node) {
    if (state[node] === 1) return false;
    if (state[node] === 2) return true;
    state[node] = 1;
    for (const nei of graph[node]) if (!dfs(nei)) return false;
    state[node] = 2;
    return true;
  }
  for (let i = 0; i < numCourses; i++) if (!dfs(i)) return false;
  return true;
}`,

  "Symmetric Tree": `function solution(root) {
  function isMirror(l, r) {
    if (!l && !r) return true;
    if (!l || !r) return false;
    return l.val === r.val && isMirror(l.left, r.right) && isMirror(l.right, r.left);
  }
  return isMirror(root, root);
}`,

  "Balanced Binary Tree": `function solution(root) {
  function height(node) {
    if (!node) return 0;
    const l = height(node.left), r = height(node.right);
    if (l < 0 || r < 0 || Math.abs(l - r) > 1) return -1;
    return 1 + Math.max(l, r);
  }
  return height(root) >= 0;
}`,

  "Binary Tree Right Side View": `function solution(root) {
  if (!root) return [];
  const res = [], queue = [root];
  while (queue.length) {
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      if (i === size - 1) res.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }
  return res;
}`,

  "Lowest Common Ancestor of a Binary Tree": `function solution(root, p, q) {
  if (!root || root === p || root === q) return root;
  const left = solution(root.left, p, q);
  const right = solution(root.right, p, q);
  return left && right ? root : left || right;
}`,

  "Path Sum III": `function solution(root, targetSum) {
  let count = 0;
  const map = new Map([[0, 1]]);
  function dfs(node, sum) {
    if (!node) return;
    sum += node.val;
    count += map.get(sum - targetSum) || 0;
    map.set(sum, (map.get(sum) || 0) + 1);
    dfs(node.left, sum); dfs(node.right, sum);
    map.set(sum, map.get(sum) - 1);
  }
  dfs(root, 0);
  return count;
}`,

  "Construct Binary Tree from Preorder and Inorder Traversal": `function solution(preorder, inorder) {
  if (!preorder.length) return null;
  const rootVal = preorder[0];
  const mid = inorder.indexOf(rootVal);
  return {
    val: rootVal,
    left: solution(preorder.slice(1, mid + 1), inorder.slice(0, mid)),
    right: solution(preorder.slice(mid + 1), inorder.slice(mid + 1))
  };
}`,

  "Serialize and Deserialize Binary Tree": `function solution() {
  return {
    serialize(root) {
      const res = [];
      function dfs(node) { if (!node) { res.push('null'); return; } res.push(node.val); dfs(node.left); dfs(node.right); }
      dfs(root); return res.join(',');
    },
    deserialize(data) {
      const nodes = data.split(','); let i = 0;
      function dfs() { if (nodes[i] === 'null') { i++; return null; } const node = { val: +nodes[i++], left: null, right: null }; node.left = dfs(); node.right = dfs(); return node; }
      return dfs();
    }
  };
}`,

  "Flatten Binary Tree to Linked List": `function solution(root) {
  let cur = root;
  while (cur) {
    if (cur.left) {
      let tail = cur.left;
      while (tail.right) tail = tail.right;
      tail.right = cur.right; cur.right = cur.left; cur.left = null;
    }
    cur = cur.right;
  }
  return root;
}`,

  "Recover Binary Search Tree": `function solution(root) {
  let first = null, second = null, prev = null;
  function inorder(node) {
    if (!node) return;
    inorder(node.left);
    if (prev && prev.val > node.val) {
      if (!first) first = prev;
      second = node;
    }
    prev = node;
    inorder(node.right);
  }
  inorder(root);
  [first.val, second.val] = [second.val, first.val];
  return root;
}`,

  "Vertical Order Traversal of a Binary Tree": `function solution(root) {
  const nodes = [];
  function dfs(node, row, col) {
    if (!node) return;
    nodes.push([col, row, node.val]);
    dfs(node.left, row + 1, col - 1);
    dfs(node.right, row + 1, col + 1);
  }
  dfs(root, 0, 0);
  nodes.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  const res = [], map = new Map();
  for (const [col, , val] of nodes) {
    if (!map.has(col)) { map.set(col, res.length); res.push([]); }
    res[map.get(col)].push(val);
  }
  return res;
}`,

  "Binary Tree Level Order Traversal": `function solution(root) {
  if (!root) return [];
  const res = [], queue = [root];
  while (queue.length) {
    const level = [], size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    res.push(level);
  }
  return res;
}`,

  "Binary Search Tree Iterator": `function solution(root) {
  const stack = [];
  function pushLeft(node) { while (node) { stack.push(node); node = node.left; } }
  pushLeft(root);
  return {
    next() { const node = stack.pop(); pushLeft(node.right); return node.val; },
    hasNext() { return stack.length > 0; }
  };
}`,

  "Graph Valid Tree": `function solution(n, edges) {
  if (edges.length !== n - 1) return false;
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  const visited = new Set([0]), queue = [0];
  while (queue.length) {
    const node = queue.shift();
    for (const nei of adj[node]) {
      if (visited.has(nei)) return false;
      visited.add(nei); queue.push(nei);
    }
  }
  return visited.size === n;
}`,

  "Redundant Connection": `function solution(edges) {
  const parent = Array.from({ length: edges.length + 1 }, (_, i) => i);
  function find(x) { return parent[x] === x ? x : (parent[x] = find(parent[x])); }
  for (const [a, b] of edges) {
    const pa = find(a), pb = find(b);
    if (pa === pb) return [a, b];
    parent[pa] = pb;
  }
}`,

  "Clone Graph": `function solution(node) {
  if (!node) return null;
  const map = new Map();
  function dfs(n) {
    if (map.has(n)) return map.get(n);
    const clone = { val: n.val, neighbors: [] };
    map.set(n, clone);
    clone.neighbors = n.neighbors.map(dfs);
    return clone;
  }
  return dfs(node);
}`,

  "Topological Sort": `function solution(n, edges) {
  const graph = Array.from({ length: n }, () => []);
  const inDegree = new Array(n).fill(0);
  for (const [a, b] of edges) { graph[a].push(b); inDegree[b]++; }
  const queue = [], res = [];
  for (let i = 0; i < n; i++) if (inDegree[i] === 0) queue.push(i);
  while (queue.length) {
    const node = queue.shift(); res.push(node);
    for (const nei of graph[node]) if (--inDegree[nei] === 0) queue.push(nei);
  }
  return res.length === n ? res : [];
}`,

  "Alien Dictionary": `function solution(words) {
  const graph = new Map();
  for (const w of words) for (const c of w) if (!graph.has(c)) graph.set(c, new Set());
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i], w2 = words[i + 1];
    const minLen = Math.min(w1.length, w2.length);
    if (w1.length > w2.length && w1.startsWith(w2)) return "";
    for (let j = 0; j < minLen; j++) {
      if (w1[j] !== w2[j]) { graph.get(w1[j]).add(w2[j]); break; }
    }
  }
  const visited = new Map(), res = [];
  function dfs(c) {
    if (visited.has(c)) return visited.get(c);
    visited.set(c, false);
    for (const nei of graph.get(c)) if (!dfs(nei)) return false;
    visited.set(c, true); res.push(c); return true;
  }
  for (const c of graph.keys()) if (!dfs(c)) return "";
  return res.reverse().join('');
}`,

  "Circle Detection in Directed Graph": `function solution(n, edges) {
  const graph = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) graph[a].push(b);
  const state = new Array(n).fill(0);
  function dfs(node) {
    if (state[node] === 1) return true;
    if (state[node] === 2) return false;
    state[node] = 1;
    for (const nei of graph[node]) if (dfs(nei)) return true;
    state[node] = 2; return false;
  }
  for (let i = 0; i < n; i++) if (dfs(i)) return true;
  return false;
}`,

  "All Paths from Root to Leaves": `function solution(root) {
  const res = [];
  function dfs(node, path) {
    if (!node) return;
    path.push(node.val);
    if (!node.left && !node.right) res.push([...path]);
    dfs(node.left, path); dfs(node.right, path);
    path.pop();
  }
  dfs(root, []);
  return res;
}`,

  "Longest Increasing Path in Matrix": `function solution(matrix) {
  const m = matrix.length, n = matrix[0].length, dp = Array.from({length:m},()=>new Array(n).fill(0));
  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
  function dfs(r, c) {
    if (dp[r][c]) return dp[r][c];
    dp[r][c] = 1;
    for (const [dr,dc] of dirs) {
      const nr = r+dr, nc = c+dc;
      if (nr>=0&&nr<m&&nc>=0&&nc<n&&matrix[nr][nc]>matrix[r][c])
        dp[r][c] = Math.max(dp[r][c], 1 + dfs(nr,nc));
    }
    return dp[r][c];
  }
  let res = 0;
  for (let r=0;r<m;r++) for (let c=0;c<n;c++) res = Math.max(res, dfs(r,c));
  return res;
}`,

  "Shortest Path in Graph with Obstacles": `function solution(grid) {
  const m = grid.length, n = grid[0].length;
  if (m === 1 && n === 1) return 0;
  const queue = [[0,0,0]], visited = new Set(['0,0']);
  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
  while (queue.length) {
    const [r,c,dist] = queue.shift();
    for (const [dr,dc] of dirs) {
      const nr=r+dr, nc=c+dc;
      if (nr<0||nr>=m||nc<0||nc>=n||grid[nr][nc]===1) continue;
      if (nr===m-1&&nc===n-1) return dist+1;
      const key = nr+','+nc;
      if (!visited.has(key)) { visited.add(key); queue.push([nr,nc,dist+1]); }
    }
  }
  return -1;
}`,

  "Minimum Spanning Tree": `function solution(n, edges) {
  edges.sort((a,b) => a[2]-b[2]);
  const parent = Array.from({length:n+1},(_,i)=>i), rank = new Array(n+1).fill(0);
  function find(x) { return parent[x]===x?x:(parent[x]=find(parent[x])); }
  function union(x,y) {
    const px=find(x),py=find(y);
    if(px===py) return false;
    if(rank[px]<rank[py]) parent[px]=py;
    else if(rank[px]>rank[py]) parent[py]=px;
    else { parent[py]=px; rank[px]++; }
    return true;
  }
  let cost=0, count=0;
  for(const [u,v,w] of edges) if(union(u,v)) { cost+=w; count++; if(count===n-1) break; }
  return count===n-1?cost:-1;
}`,

  // ─── Binary Search & Heaps ────────────────────────────────────────────────
  "Binary Search": `function solution(nums, target) {
  let l = 0, r = nums.length - 1;
  while (l <= r) {
    const mid = (l + r) >> 1;
    if (nums[mid] === target) return mid;
    else if (nums[mid] < target) l = mid + 1;
    else r = mid - 1;
  }
  return -1;
}`,

  "Search Insert Position": `function solution(nums, target) {
  let l = 0, r = nums.length;
  while (l < r) {
    const mid = (l + r) >> 1;
    if (nums[mid] < target) l = mid + 1; else r = mid;
  }
  return l;
}`,

  "Find Minimum in Rotated Sorted Array": `function solution(nums) {
  let l = 0, r = nums.length - 1;
  while (l < r) {
    const mid = (l + r) >> 1;
    if (nums[mid] > nums[r]) l = mid + 1; else r = mid;
  }
  return nums[l];
}`,

  "Search a 2D Matrix": `function solution(matrix, target) {
  let l = 0, r = matrix.length * matrix[0].length - 1;
  const cols = matrix[0].length;
  while (l <= r) {
    const mid = (l + r) >> 1;
    const val = matrix[Math.floor(mid / cols)][mid % cols];
    if (val === target) return true;
    else if (val < target) l = mid + 1;
    else r = mid - 1;
  }
  return false;
}`,

  "First Bad Version": `function solution(n, isBadVersion) {
  let l = 1, r = n;
  while (l < r) {
    const mid = Math.floor((l + r) / 2);
    if (isBadVersion(mid)) r = mid; else l = mid + 1;
  }
  return l;
}`,

  "Search in Rotated Sorted Array II": `function solution(nums, target) {
  let l = 0, r = nums.length - 1;
  while (l <= r) {
    const mid = (l + r) >> 1;
    if (nums[mid] === target) return true;
    if (nums[l] === nums[mid] && nums[mid] === nums[r]) { l++; r--; }
    else if (nums[l] <= nums[mid]) {
      if (nums[l] <= target && target < nums[mid]) r = mid - 1; else l = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[r]) l = mid + 1; else r = mid - 1;
    }
  }
  return false;
}`,

  "Kth Largest Element in an Array": `function solution(nums, k) {
  nums.sort((a, b) => b - a);
  return nums[k - 1];
}`,

  "Top K Frequent Elements": `function solution(nums, k) {
  const freq = new Map();
  for (const n of nums) freq.set(n, (freq.get(n) || 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(e => e[0]);
}`,

  "Find Median from Data Stream": `function solution() {
  const lo = [], hi = [];
  const push = (heap, val, max=true) => {
    heap.push(val); heap.sort((a,b)=>max?b-a:a-b);
  };
  return {
    addNum(num) {
      push(lo, num, true);
      push(hi, lo.shift(), false);
      if (lo.length < hi.length) push(lo, hi.shift(), true);
    },
    findMedian() {
      return lo.length > hi.length ? lo[0] : (lo[0] + hi[0]) / 2;
    }
  };
}`,

  "Median of Two Sorted Arrays": `function solution(nums1, nums2) {
  if (nums1.length > nums2.length) [nums1, nums2] = [nums2, nums1];
  const m = nums1.length, n = nums2.length, half = Math.floor((m + n + 1) / 2);
  let l = 0, r = m;
  while (l <= r) {
    const i = (l + r) >> 1, j = half - i;
    if (i < m && nums2[j - 1] > nums1[i]) l = i + 1;
    else if (i > 0 && nums1[i - 1] > nums2[j]) r = i - 1;
    else {
      const maxLeft = i === 0 ? -Infinity : Math.max(nums1[i-1], j===0?-Infinity:nums2[j-1]);
      if ((m + n) % 2) return maxLeft;
      const minRight = i === m ? Infinity : Math.min(nums1[i], j===n?Infinity:nums2[j]);
      return (maxLeft + minRight) / 2;
    }
  }
}`,

  "Time Based Key-Value Store": `function solution() {
  const store = new Map();
  return {
    set(key, value, timestamp) {
      if (!store.has(key)) store.set(key, []);
      store.get(key).push([timestamp, value]);
    },
    get(key, timestamp) {
      if (!store.has(key)) return "";
      const arr = store.get(key);
      let l = 0, r = arr.length - 1, res = "";
      while (l <= r) {
        const mid = (l + r) >> 1;
        if (arr[mid][0] <= timestamp) { res = arr[mid][1]; l = mid + 1; } else r = mid - 1;
      }
      return res;
    }
  };
}`,

  "Sqrt(x)": `function solution(x) {
  if (x < 2) return x;
  let l = 1, r = Math.floor(x / 2);
  while (l <= r) {
    const mid = (l + r) >> 1;
    if (mid * mid === x) return mid;
    else if (mid * mid < x) l = mid + 1;
    else r = mid - 1;
  }
  return r;
}`,

  "Sqrt II": `function solution(x) {
  if (x < 2) return x;
  let l = 1, r = Math.floor(x / 2);
  while (l <= r) {
    const mid = (l + r) >> 1;
    if (mid * mid === x) return mid;
    else if (mid * mid < x) l = mid + 1;
    else r = mid - 1;
  }
  return r;
}`,

  "Guess Number Higher or Lower": `function solution(n, guess) {
  let l = 1, r = n;
  while (l <= r) {
    const mid = (l + r) >> 1;
    const res = guess(mid);
    if (res === 0) return mid;
    else if (res < 0) r = mid - 1;
    else l = mid + 1;
  }
}`,

  "Single Element in a Sorted Array": `function solution(nums) {
  let l = 0, r = nums.length - 1;
  while (l < r) {
    const mid = (l + r) >> 1;
    if (mid % 2 === 1) mid--;
    if (nums[mid] === nums[mid + 1]) l = mid + 2; else r = mid;
  }
  return nums[l];
}`,

  "Capacity To Ship Packages Within D Days": `function solution(weights, days) {
  let l = Math.max(...weights), r = weights.reduce((a,b) => a+b, 0);
  while (l < r) {
    const mid = (l + r) >> 1;
    let d = 1, cur = 0;
    for (const w of weights) { if (cur + w > mid) { d++; cur = 0; } cur += w; }
    if (d <= days) r = mid; else l = mid + 1;
  }
  return l;
}`,

  "Split Array Largest Sum": `function solution(nums, k) {
  let l = Math.max(...nums), r = nums.reduce((a,b)=>a+b,0);
  while (l < r) {
    const mid = (l+r)>>1;
    let parts=1, cur=0;
    for(const n of nums){if(cur+n>mid){parts++;cur=0;}cur+=n;}
    if(parts<=k) r=mid; else l=mid+1;
  }
  return l;
}`,

  "Minimum Number of Refueling Stops": `function solution(target, startFuel, stations) {
  const pq = [];
  let fuel = startFuel, stops = 0, prev = 0;
  stations.push([target, 0]);
  for (const [pos, cap] of stations) {
    fuel -= pos - prev; prev = pos;
    while (fuel < 0 && pq.length) { fuel += pq.pop(); stops++; }
    if (fuel < 0) return -1;
    pq.push(cap); pq.sort((a,b)=>a-b);
  }
  return stops;
}`,

  "Sliding Window Median": `function solution(nums, k) {
  const res = [];
  for (let i = 0; i <= nums.length - k; i++) {
    const win = nums.slice(i, i + k).sort((a,b)=>a-b);
    res.push(k % 2 ? win[k>>1] : (win[(k>>1)-1] + win[k>>1]) / 2);
  }
  return res;
}`,

  "Smallest Range Covering Elements from K Lists": `function solution(nums) {
  const all = nums.flatMap((list, i) => list.map(v => [v, i]));
  all.sort((a,b)=>a[0]-b[0]);
  const count = new Map(), k = nums.length;
  let have = 0, l = 0, res = [-Infinity, Infinity];
  for (let r = 0; r < all.length; r++) {
    const [val, group] = all[r];
    count.set(group, (count.get(group)||0)+1);
    if (count.get(group) === 1) have++;
    while (have === k) {
      const [lv, lg] = all[l];
      if (val - lv < res[1] - res[0]) res = [lv, val];
      count.set(lg, count.get(lg)-1);
      if (count.get(lg) === 0) have--;
      l++;
    }
  }
  return res;
}`,

  "Closest Binary Search Tree Value": `function solution(root, target) {
  let closest = root.val;
  let cur = root;
  while (cur) {
    if (Math.abs(cur.val - target) < Math.abs(closest - target)) closest = cur.val;
    cur = target < cur.val ? cur.left : cur.right;
  }
  return closest;
}`,

  "Data Stream as Disjoint Intervals": `function solution() {
  const intervals = [];
  return {
    addNum(val) {
      intervals.push([val, val]);
      intervals.sort((a,b)=>a[0]-b[0]);
      const merged = [intervals[0]];
      for (let i = 1; i < intervals.length; i++) {
        const last = merged[merged.length-1];
        if (intervals[i][0] <= last[1]+1) last[1] = Math.max(last[1], intervals[i][1]);
        else merged.push(intervals[i]);
      }
      intervals.length = 0; intervals.push(...merged);
    },
    getIntervals() { return intervals; }
  };
}`,

  "Stock Span": `function solution() {
  const stack = [];
  return {
    next(price) {
      let span = 1;
      while (stack.length && stack[stack.length-1][0] <= price) span += stack.pop()[1];
      stack.push([price, span]);
      return span;
    }
  };
}`,

  "LRU Cache": `function solution(capacity) {
  const map = new Map();
  return {
    get(key) {
      if (!map.has(key)) return -1;
      const val = map.get(key); map.delete(key); map.set(key, val); return val;
    },
    put(key, value) {
      map.delete(key);
      if (map.size >= capacity) map.delete(map.keys().next().value);
      map.set(key, value);
    }
  };
}`,

  // ─── Dynamic Programming ──────────────────────────────────────────────────
  "Climbing Stairs": `function solution(n) {
  if (n <= 2) return n;
  let a = 1, b = 2;
  for (let i = 3; i <= n; i++) { [a, b] = [b, a + b]; }
  return b;
}`,

  "Coin Change": `function solution(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++)
    for (const c of coins)
      if (c <= i) dp[i] = Math.min(dp[i], dp[i - c] + 1);
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,

  "House Robber": `function solution(nums) {
  let prev2 = 0, prev1 = 0;
  for (const n of nums) { [prev2, prev1] = [prev1, Math.max(prev1, prev2 + n)]; }
  return prev1;
}`,

  "Longest Common Subsequence": `function solution(text1, text2) {
  const m = text1.length, n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = text1[i-1] === text2[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
  return dp[m][n];
}`,

  "Edit Distance": `function solution(word1, word2) {
  const m = word1.length, n = word2.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i || j));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = word1[i-1] === word2[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}`,

  "House Robber II": `function solution(nums) {
  if (nums.length === 1) return nums[0];
  function rob(arr) {
    let p2 = 0, p1 = 0;
    for (const n of arr) { [p2, p1] = [p1, Math.max(p1, p2 + n)]; }
    return p1;
  }
  return Math.max(rob(nums.slice(0, -1)), rob(nums.slice(1)));
}`,

  "Longest Increasing Subsequence Length": `function solution(nums) {
  const tails = [];
  for (const n of nums) {
    let l = 0, r = tails.length;
    while (l < r) { const mid = (l+r)>>1; if (tails[mid] < n) l=mid+1; else r=mid; }
    tails[l] = n;
  }
  return tails.length;
}`,

  "Unique Paths": `function solution(m, n) {
  const dp = new Array(n).fill(1);
  for (let i = 1; i < m; i++)
    for (let j = 1; j < n; j++)
      dp[j] += dp[j-1];
  return dp[n-1];
}`,

  "Unique Paths II": `function solution(grid) {
  const m = grid.length, n = grid[0].length;
  const dp = new Array(n).fill(0);
  dp[0] = grid[0][0] === 0 ? 1 : 0;
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === 1) dp[j] = 0;
      else if (j > 0) dp[j] += dp[j-1];
    }
  return dp[n-1];
}`,

  "Minimum Path Sum": `function solution(grid) {
  const m = grid.length, n = grid[0].length;
  for (let r = 0; r < m; r++)
    for (let c = 0; c < n; c++) {
      if (r === 0 && c === 0) continue;
      const up = r > 0 ? grid[r-1][c] : Infinity;
      const left = c > 0 ? grid[r][c-1] : Infinity;
      grid[r][c] += Math.min(up, left);
    }
  return grid[m-1][n-1];
}`,

  "Burst Balloons": `function solution(nums) {
  nums = [1, ...nums, 1];
  const n = nums.length;
  const dp = Array.from({length:n},()=>new Array(n).fill(0));
  for (let len = 2; len < n; len++)
    for (let l = 0; l < n - len; l++) {
      const r = l + len;
      for (let k = l+1; k < r; k++)
        dp[l][r] = Math.max(dp[l][r], nums[l]*nums[k]*nums[r] + dp[l][k] + dp[k][r]);
    }
  return dp[0][n-1];
}`,

  "Decode Ways": `function solution(s) {
  if (!s || s[0] === '0') return 0;
  const n = s.length;
  const dp = new Array(n+1).fill(0);
  dp[0] = dp[1] = 1;
  for (let i = 2; i <= n; i++) {
    if (s[i-1] !== '0') dp[i] += dp[i-1];
    const two = +s.slice(i-2, i);
    if (two >= 10 && two <= 26) dp[i] += dp[i-2];
  }
  return dp[n];
}`,

  "Regular Expression Matching": `function solution(s, p) {
  const m = s.length, n = p.length;
  const dp = Array.from({length:m+1},()=>new Array(n+1).fill(false));
  dp[0][0] = true;
  for (let j = 1; j <= n; j++) if (p[j-1]==='*') dp[0][j] = dp[0][j-2];
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      if (p[j-1]==='*') {
        dp[i][j] = dp[i][j-2] || ((p[j-2]==='.'||p[j-2]===s[i-1]) && dp[i-1][j]);
      } else {
        dp[i][j] = (p[j-1]==='.'||p[j-1]===s[i-1]) && dp[i-1][j-1];
      }
    }
  return dp[m][n];
}`,

  "Distinct Subsequences": `function solution(s, t) {
  const m = s.length, n = t.length;
  const dp = Array.from({length:m+1},()=>new Array(n+1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = 1;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      dp[i][j] = dp[i-1][j];
      if (s[i-1] === t[j-1]) dp[i][j] += dp[i-1][j-1];
    }
  return dp[m][n];
}`,

  "Wildcard Matching": `function solution(s, p) {
  const m = s.length, n = p.length;
  const dp = Array.from({length:m+1},()=>new Array(n+1).fill(false));
  dp[0][0] = true;
  for (let j = 1; j <= n; j++) if (p[j-1]==='*') dp[0][j] = dp[0][j-1];
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      if (p[j-1]==='*') dp[i][j] = dp[i-1][j] || dp[i][j-1];
      else dp[i][j] = (p[j-1]==='?'||p[j-1]===s[i-1]) && dp[i-1][j-1];
    }
  return dp[m][n];
}`,

  "Palindrome Partitions in Array": `function solution(s) {
  const n = s.length;
  const isPalin = Array.from({length:n},()=>new Array(n).fill(false));
  for (let i = n-1; i >= 0; i--)
    for (let j = i; j < n; j++)
      isPalin[i][j] = s[i]===s[j] && (j-i<=2 || isPalin[i+1][j-1]);
  const dp = new Array(n+1).fill(Infinity); dp[0] = 0;
  for (let i = 1; i <= n; i++)
    for (let j = 0; j < i; j++)
      if (isPalin[j][i-1]) dp[i] = Math.min(dp[i], dp[j]+1);
  return dp[n]-1;
}`,

  "Russian Doll Envelopes": `function solution(envelopes) {
  envelopes.sort((a,b)=>a[0]-b[0]||(b[1]-a[1]));
  const tails = [];
  for (const [,h] of envelopes) {
    let l=0, r=tails.length;
    while(l<r){const mid=(l+r)>>1; if(tails[mid]<h)l=mid+1;else r=mid;}
    tails[l]=h;
  }
  return tails.length;
}`,

  "Delete and Earn": `function solution(nums) {
  const max = Math.max(...nums);
  const sum = new Array(max+1).fill(0);
  for (const n of nums) sum[n] += n;
  let p2=0, p1=0;
  for (const s of sum) [p2,p1]=[p1,Math.max(p1,p2+s)];
  return p1;
}`,

  "Min Cost Climbing Stairs": `function solution(cost) {
  const n = cost.length;
  const dp = [...cost, 0];
  for (let i = 2; i < dp.length; i++) dp[i] += Math.min(dp[i-1], dp[i-2]);
  return dp[dp.length-1];
}`,

  "Counting Bits DP": `function solution(n) {
  const dp = new Array(n+1).fill(0);
  for (let i = 1; i <= n; i++) dp[i] = dp[i>>1] + (i&1);
  return dp;
}`,

  "Super Ugly Number": `function solution(n, primes) {
  const dp = new Array(n).fill(1);
  const idx = new Array(primes.length).fill(0);
  for (let i = 1; i < n; i++) {
    const candidates = primes.map((p,j)=>p*dp[idx[j]]);
    const min = Math.min(...candidates);
    dp[i] = min;
    for (let j = 0; j < primes.length; j++) if (candidates[j]===min) idx[j]++;
  }
  return dp[n-1];
}`,

  "Queue Reconstruction by Height": `function solution(people) {
  people.sort((a,b)=>b[0]-a[0]||a[1]-b[1]);
  const res = [];
  for (const p of people) res.splice(p[1],0,p);
  return res;
}`,

  // ─── Backtracking & Recursion ─────────────────────────────────────────────
  "Subsets": `function solution(nums) {
  const res = [[]];
  for (const n of nums) {
    const len = res.length;
    for (let i = 0; i < len; i++) res.push([...res[i], n]);
  }
  return res;
}`,

  "Permutations": `function solution(nums) {
  const res = [];
  function bt(path, used) {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true; path.push(nums[i]);
      bt(path, used);
      used[i] = false; path.pop();
    }
  }
  bt([], new Array(nums.length).fill(false));
  return res;
}`,

  "Combination Sum": `function solution(candidates, target) {
  const res = [];
  function bt(start, path, rem) {
    if (rem === 0) { res.push([...path]); return; }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > rem) continue;
      path.push(candidates[i]);
      bt(i, path, rem - candidates[i]);
      path.pop();
    }
  }
  candidates.sort((a,b)=>a-b);
  bt(0, [], target);
  return res;
}`,

  "Generate Parentheses": `function solution(n) {
  const res = [];
  function bt(s, open, close) {
    if (s.length === 2 * n) { res.push(s); return; }
    if (open < n) bt(s + '(', open + 1, close);
    if (close < open) bt(s + ')', open, close + 1);
  }
  bt('', 0, 0);
  return res;
}`,

  "Word Search": `function solution(board, word) {
  const m = board.length, n = board[0].length;
  function dfs(r, c, i) {
    if (i === word.length) return true;
    if (r<0||r>=m||c<0||c>=n||board[r][c]!==word[i]) return false;
    const tmp = board[r][c]; board[r][c] = '#';
    const found = dfs(r+1,c,i+1)||dfs(r-1,c,i+1)||dfs(r,c+1,i+1)||dfs(r,c-1,i+1);
    board[r][c] = tmp;
    return found;
  }
  for (let r=0;r<m;r++) for (let c=0;c<n;c++) if (dfs(r,c,0)) return true;
  return false;
}`,

  "N-Queens Count": `function solution(n) {
  let count = 0;
  const cols = new Set(), diag1 = new Set(), diag2 = new Set();
  function bt(row) {
    if (row === n) { count++; return; }
    for (let col = 0; col < n; col++) {
      if (cols.has(col)||diag1.has(row-col)||diag2.has(row+col)) continue;
      cols.add(col); diag1.add(row-col); diag2.add(row+col);
      bt(row+1);
      cols.delete(col); diag1.delete(row-col); diag2.delete(row+col);
    }
  }
  bt(0);
  return count;
}`,

  "Letter Combinations of a Phone Number": `function solution(digits) {
  if (!digits) return [];
  const map = {'2':'abc','3':'def','4':'ghi','5':'jkl','6':'mno','7':'pqrs','8':'tuv','9':'wxyz'};
  const res = [];
  function bt(i, path) {
    if (i === digits.length) { res.push(path); return; }
    for (const c of map[digits[i]]) bt(i+1, path+c);
  }
  bt(0, '');
  return res;
}`,

  "Palindrome Partitioning": `function solution(s) {
  const res = [];
  function isPalin(str) { return str === str.split('').reverse().join(''); }
  function bt(start, path) {
    if (start === s.length) { res.push([...path]); return; }
    for (let end = start+1; end <= s.length; end++) {
      const sub = s.slice(start, end);
      if (isPalin(sub)) { path.push(sub); bt(end, path); path.pop(); }
    }
  }
  bt(0, []);
  return res;
}`,

  "Restore IP Addresses": `function solution(s) {
  const res = [];
  function bt(start, parts) {
    if (parts.length === 4 && start === s.length) { res.push(parts.join('.')); return; }
    if (parts.length === 4 || start === s.length) return;
    for (let len = 1; len <= 3; len++) {
      const seg = s.slice(start, start+len);
      if ((seg.startsWith('0') && seg.length > 1) || +seg > 255) continue;
      bt(start+len, [...parts, seg]);
    }
  }
  bt(0, []);
  return res;
}`,

  "Combination Sum II": `function solution(candidates, target) {
  candidates.sort((a,b)=>a-b);
  const res = [];
  function bt(start, path, rem) {
    if (rem === 0) { res.push([...path]); return; }
    for (let i = start; i < candidates.length; i++) {
      if (i > start && candidates[i] === candidates[i-1]) continue;
      if (candidates[i] > rem) break;
      path.push(candidates[i]); bt(i+1, path, rem-candidates[i]); path.pop();
    }
  }
  bt(0, [], target);
  return res;
}`,

  "Subset II": `function solution(nums) {
  nums.sort((a,b)=>a-b);
  const res = [];
  function bt(start, path) {
    res.push([...path]);
    for (let i = start; i < nums.length; i++) {
      if (i > start && nums[i] === nums[i-1]) continue;
      path.push(nums[i]); bt(i+1, path); path.pop();
    }
  }
  bt(0, []);
  return res;
}`,

  "Combinations": `function solution(n, k) {
  const res = [];
  function bt(start, path) {
    if (path.length === k) { res.push([...path]); return; }
    for (let i = start; i <= n; i++) { path.push(i); bt(i+1, path); path.pop(); }
  }
  bt(1, []);
  return res;
}`,

  "Permutation Sequence": `function solution(n, k) {
  const nums = Array.from({length:n},(_,i)=>i+1);
  let fact = 1;
  for (let i = 1; i < n; i++) fact *= i;
  k--;
  let res = '';
  for (let i = n; i >= 1; i--) {
    const idx = Math.floor(k / fact);
    res += nums.splice(idx, 1)[0];
    if (i > 1) { k %= fact; fact /= (i-1); }
  }
  return res;
}`,

  "Permutations II": `function solution(nums) {
  nums.sort((a,b)=>a-b);
  const res = [], used = new Array(nums.length).fill(false);
  function bt(path) {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i] || (i>0&&nums[i]===nums[i-1]&&!used[i-1])) continue;
      used[i]=true; path.push(nums[i]); bt(path); path.pop(); used[i]=false;
    }
  }
  bt([]);
  return res;
}`,

  "Combination Sum III": `function solution(k, n) {
  const res = [];
  function bt(start, path, rem) {
    if (path.length===k&&rem===0) { res.push([...path]); return; }
    if (path.length===k||rem<=0) return;
    for (let i = start; i <= 9; i++) { path.push(i); bt(i+1,path,rem-i); path.pop(); }
  }
  bt(1, [], n);
  return res;
}`,

  "Subsets with Duplicate Target Sum": `function solution(nums, target) {
  nums.sort((a,b)=>a-b);
  const res = [];
  function bt(start, path, rem) {
    if (rem===0) { res.push([...path]); return; }
    for (let i=start;i<nums.length;i++) {
      if (i>start&&nums[i]===nums[i-1]) continue;
      if (nums[i]>rem) break;
      path.push(nums[i]); bt(i+1,path,rem-nums[i]); path.pop();
    }
  }
  bt(0,[],target);
  return res;
}`,

  "Target Sum": `function solution(nums, target) {
  let count = 0;
  function bt(i, sum) {
    if (i===nums.length) { if(sum===target) count++; return; }
    bt(i+1, sum+nums[i]); bt(i+1, sum-nums[i]);
  }
  bt(0, 0);
  return count;
}`,

  "Partition to K Equal Sum Subsets": `function solution(nums, k) {
  const total = nums.reduce((a,b)=>a+b,0);
  if (total%k!==0) return false;
  const target=total/k, buckets=new Array(k).fill(0);
  nums.sort((a,b)=>b-a);
  function bt(i) {
    if (i===nums.length) return buckets.every(b=>b===target);
    const seen=new Set();
    for (let j=0;j<k;j++) {
      if (seen.has(buckets[j])) continue;
      if (buckets[j]+nums[i]<=target) {
        seen.add(buckets[j]); buckets[j]+=nums[i];
        if (bt(i+1)) return true;
        buckets[j]-=nums[i];
      }
    }
    return false;
  }
  return bt(0);
}`,

  "Remove Invalid Parentheses": `function solution(s) {
  const res = new Set();
  let minRemoved = Infinity;
  function bt(i, open, close, removed, cur) {
    if (i===s.length) {
      if (open===close) {
        if (removed<minRemoved) { minRemoved=removed; res.clear(); }
        if (removed===minRemoved) res.add(cur);
      }
      return;
    }
    const c=s[i];
    if (c!=='('&&c!==')') { bt(i+1,open,close,removed,cur+c); return; }
    bt(i+1,open,close,removed+1,cur); // skip
    if (c==='(') bt(i+1,open+1,close,removed,cur+c);
    else if (close<open) bt(i+1,open,close+1,removed,cur+c);
  }
  bt(0,0,0,0,'');
  return [...res];
}`,

  "Expression Add Operators": `function solution(num, target) {
  const res = [];
  function bt(i, path, eval_, mul) {
    if (i===num.length) { if(eval_===target) res.push(path); return; }
    for (let j=i;j<num.length;j++) {
      if (j>i&&num[i]==='0') break;
      const cur=+num.slice(i,j+1);
      if (i===0) bt(j+1,''+cur,cur,cur);
      else {
        bt(j+1,path+'+'+cur,eval_+cur,cur);
        bt(j+1,path+'-'+cur,eval_-cur,-cur);
        bt(j+1,path+'*'+cur,eval_-mul+mul*cur,mul*cur);
      }
    }
  }
  bt(0,'',0,0);
  return res;
}`,

  "Unique Paths III": `function solution(grid) {
  const m=grid.length, n=grid[0].length;
  let start, empty=1, count=0;
  for (let r=0;r<m;r++) for (let c=0;c<n;c++) {
    if (grid[r][c]===1) start=[r,c];
    else if (grid[r][c]===0) empty++;
  }
  function dfs(r,c,rem) {
    if (grid[r][c]===2) { if(rem===0) count++; return; }
    const tmp=grid[r][c]; grid[r][c]=-1;
    for (const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nr=r+dr, nc=c+dc;
      if (nr>=0&&nr<m&&nc>=0&&nc<n&&grid[nr][nc]!==-1) dfs(nr,nc,rem-1);
    }
    grid[r][c]=tmp;
  }
  dfs(start[0],start[1],empty);
  return count;
}`,

  "Sudoku Solver": `function solution(board) {
  function isValid(r,c,val) {
    const box_r=Math.floor(r/3)*3, box_c=Math.floor(c/3)*3;
    for (let i=0;i<9;i++) {
      if (board[r][i]===val||board[i][c]===val) return false;
      if (board[box_r+Math.floor(i/3)][box_c+(i%3)]===val) return false;
    }
    return true;
  }
  function solve() {
    for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
      if (board[r][c]==='.') {
        for (let d=1;d<=9;d++) {
          const val=String(d);
          if (isValid(r,c,val)) {
            board[r][c]=val;
            if (solve()) return true;
            board[r][c]='.';
          }
        }
        return false;
      }
    }
    return true;
  }
  solve();
  return board;
}`,

  "Min Consecutive Days": `function solution(tasks, sessionTime) {
  tasks.sort((a,b)=>b-a);
  const n=tasks.length;
  let l=1, r=n;
  function canFinish(days) {
    const buckets=new Array(days).fill(0);
    function bt(i) {
      if (i===n) return true;
      const seen=new Set();
      for (let j=0;j<days;j++) {
        if (seen.has(buckets[j])) continue;
        if (buckets[j]+tasks[i]<=sessionTime) {
          seen.add(buckets[j]); buckets[j]+=tasks[i];
          if (bt(i+1)) return true;
          buckets[j]-=tasks[i];
        }
      }
      return false;
    }
    return bt(0);
  }
  while (l<r) { const mid=(l+r)>>1; if(canFinish(mid)) r=mid; else l=mid+1; }
  return l;
}`,

  // ─── Bit Manipulation & Math ──────────────────────────────────────────────
  "Single Number": `function solution(nums) {
  return nums.reduce((a, b) => a ^ b, 0);
}`,

  "Counting Bits": `function solution(n) {
  const res = [];
  for (let i = 0; i <= n; i++) res.push(i.toString(2).split('1').length - 1);
  return res;
}`,

  "Reverse Bits": `function solution(n) {
  let result = 0;
  for (let i = 0; i < 32; i++) {
    result = (result * 2) + (n & 1);
    n >>= 1;
  }
  return result >>> 0;
}`,

  "Power of Two": `function solution(n) {
  return n > 0 && (n & (n - 1)) === 0;
}`,

  "Sum of Two Integers": `function solution(a, b) {
  while (b !== 0) {
    const carry = (a & b) << 1;
    a = a ^ b;
    b = carry;
  }
  return a;
}`,

  "Number of 1 Bits": `function solution(n) {
  let count = 0;
  while (n !== 0) { count += n & 1; n >>>= 1; }
  return count;
}`,

  "Missing Number": `function solution(nums) {
  const n = nums.length;
  return (n * (n + 1)) / 2 - nums.reduce((a, b) => a + b, 0);
}`,

  "Divide Two Integers": `function solution(dividend, divisor) {
  const MAX = 2147483647, MIN = -2147483648;
  if (dividend === MIN && divisor === -1) return MAX;
  const sign = (dividend > 0) === (divisor > 0) ? 1 : -1;
  let a = Math.abs(dividend), b = Math.abs(divisor), res = 0;
  while (a >= b) {
    let tmp = b, mul = 1;
    while (a >= tmp * 2) { tmp *= 2; mul *= 2; }
    a -= tmp; res += mul;
  }
  return sign * res;
}`,

  "Add Binary (bit)": `function solution(a, b) {
  let i = a.length - 1, j = b.length - 1, carry = 0, res = '';
  while (i >= 0 || j >= 0 || carry) {
    const sum = (+( a[i--] || 0)) + (+(b[j--] || 0)) + carry;
    carry = Math.floor(sum / 2); res = (sum % 2) + res;
  }
  return res;
}`,

  "UTF-8 Validation": `function solution(data) {
  let i = 0;
  while (i < data.length) {
    const b = data[i];
    let numBytes = 0;
    if ((b & 0x80) === 0) numBytes = 1;
    else if ((b & 0xE0) === 0xC0) numBytes = 2;
    else if ((b & 0xF0) === 0xE0) numBytes = 3;
    else if ((b & 0xF8) === 0xF0) numBytes = 4;
    else return false;
    for (let j = 1; j < numBytes; j++) {
      if (i + j >= data.length || (data[i+j] & 0xC0) !== 0x80) return false;
    }
    i += numBytes;
  }
  return true;
}`,

  "Factorial Trailing Zeros": `function solution(n) {
  let count = 0;
  while (n >= 5) { n = Math.floor(n / 5); count += n; }
  return count;
}`,

  "Happy Number": `function solution(n) {
  const seen = new Set();
  while (n !== 1) {
    if (seen.has(n)) return false;
    seen.add(n);
    n = String(n).split('').reduce((s, d) => s + d * d, 0);
  }
  return true;
}`,

  "Happy Sequence": `function solution(n) {
  function isHappy(num) {
    const seen = new Set();
    while (num !== 1) {
      if (seen.has(num)) return false;
      seen.add(num);
      num = String(num).split('').reduce((s,d)=>s+d*d,0);
    }
    return true;
  }
  const res = [];
  for (let i = 1; i <= n; i++) if (isHappy(i)) res.push(i);
  return res;
}`,

  "Pow(x, n)": `function solution(x, n) {
  if (n < 0) { x = 1 / x; n = -n; }
  let res = 1;
  while (n > 0) {
    if (n & 1) res *= x;
    x *= x; n >>= 1;
  }
  return res;
}`,

  "Integer to Roman": `function solution(num) {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let res = '';
  for (let i = 0; i < vals.length; i++)
    while (num >= vals[i]) { res += syms[i]; num -= vals[i]; }
  return res;
}`,

  "Roman to Integer": `function solution(s) {
  const map = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
  let res = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]], next = map[s[i+1]];
    res += (next && next > cur) ? -cur : cur;
  }
  return res;
}`,

  "Excel Sheet Column Number": `function solution(columnTitle) {
  let res = 0;
  for (const c of columnTitle) res = res * 26 + (c.charCodeAt(0) - 64);
  return res;
}`,

  "Excel Sheet Column Title": `function solution(columnNumber) {
  let res = '';
  while (columnNumber > 0) {
    columnNumber--;
    res = String.fromCharCode(65 + (columnNumber % 26)) + res;
    columnNumber = Math.floor(columnNumber / 26);
  }
  return res;
}`,

  "Find the Celebrity": `function solution(n, knows) {
  let candidate = 0;
  for (let i = 1; i < n; i++) if (knows(candidate, i)) candidate = i;
  for (let i = 0; i < n; i++) {
    if (i !== candidate && (knows(candidate, i) || !knows(i, candidate))) return -1;
  }
  return candidate;
}`,

  "Human Traffic of Stadium": `function solution(records) {
  const high = records.filter(r => r.people >= 100);
  const result = [];
  for (let i = 0; i < high.length; i++) {
    if (i + 2 < high.length &&
        high[i+1].id === high[i].id + 1 &&
        high[i+2].id === high[i].id + 2) {
      for (let j = i; j <= i+2; j++) if (!result.some(r=>r.id===high[j].id)) result.push(high[j]);
    }
  }
  return result.sort((a,b)=>a.id-b.id);
}`,
};

async function main() {
  console.log(`Patching ${Object.keys(SOLUTIONS).length} solutions into the database...\n`);

  let updated = 0, notFound = 0;

  for (const [title, solution] of Object.entries(SOLUTIONS)) {
    // Find all questions with this title (there may be duplicates)
    const questions = await prisma.question.findMany({
      where: { title },
      select: { id: true, solutions: true }
    });

    if (questions.length === 0) {
      console.log(`  [NOT FOUND] "${title}"`);
      notFound++;
      continue;
    }

    for (const q of questions) {
      // Merge: preserve existing solutions for other languages, set/update javascript
      const existing = (q.solutions && typeof q.solutions === "object" && !Array.isArray(q.solutions))
        ? q.solutions
        : {};
      await prisma.question.update({
        where: { id: q.id },
        data: { solutions: { ...existing, javascript: solution } }
      });
      updated++;
    }
    console.log(`  [OK] "${title}" (${questions.length} row${questions.length > 1 ? 's' : ''})`);
  }

  // Report questions still missing solutions
  const stillMissing = await prisma.question.count({ where: { solutions: { equals: null } } });

  console.log(`\n─────────────────────────────────────`);
  console.log(`Updated: ${updated} | Not found in DB: ${notFound} | Still missing: ${stillMissing}`);

  if (stillMissing > 0) {
    const missing = await prisma.question.findMany({ where: { solutions: { equals: null } }, select: { title: true } });
    console.log(`\nQuestions still missing solutions:`);
    missing.forEach(q => console.log(`  - ${q.title}`));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
