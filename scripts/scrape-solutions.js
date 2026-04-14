/**
 * scrape-solutions.js
 *
 * Fetches solutions from neetcode-gh/leetcode GitHub repo.
 * Languages: python, typescript, java, cpp
 * Strategy: raw URL fetch using LC number + slug (no API rate limits)
 * Merges into existing `solutions` Json map (preserves JS).
 *
 * Usage:
 *   node scripts/scrape-solutions.js
 *   node scripts/scrape-solutions.js --dry-run
 *   node scripts/scrape-solutions.js --lang python
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");
const ONLY_LANG = (() => {
  const idx = process.argv.indexOf("--lang");
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

const DELAY_MS = 100;
const BASE_URL = "https://raw.githubusercontent.com/neetcode-gh/leetcode/main";

// ─── Lang config ──────────────────────────────────────────────────────────────
const LANGS = [
  { key: "python",     ext: "py",   dir: "python"     },
  { key: "typescript", ext: "ts",   dir: "typescript" },
  { key: "java",       ext: "java", dir: "java"       },
  { key: "cpp",        ext: "cpp",  dir: "cpp"        },
];

// ─── Title → LC number + optional slug override ───────────────────────────────
// slug: override when title-derived slug ≠ NeetCode filename slug
const TITLE_MAP = {
  "Two Sum":                                              { n: 1 },
  "Add Two Numbers":                                      { n: 2 },
  "Longest Substring Without Repeating Characters":       { n: 3 },
  "Longest Substring Without Repeating":                  { n: 3 },
  "Median of Two Sorted Arrays":                          { n: 4 },
  "Longest Palindromic Substring":                        { n: 5 },
  "Regular Expression Matching":                          { n: 10 },
  "Container With Most Water":                            { n: 11 },
  "Integer to Roman":                                     { n: 12 },
  "Roman to Integer":                                     { n: 13 },
  "3Sum":                                                 { n: 15 },
  "4Sum":                                                 { n: 18 },
  "Remove Nth Node From End of List":                     { n: 19 },
  "Valid Parentheses":                                    { n: 20 },
  "Merge Two Sorted Lists":                               { n: 21 },
  "Generate Parentheses":                                 { n: 22 },
  "Swap Nodes in Pairs":                                  { n: 24 },
  "Divide Two Integers":                                  { n: 29 },
  "Next Permutation":                                     { n: 31 },
  "Longest Valid Parentheses":                            { n: 32 },
  "Search Insert Position":                               { n: 35 },
  "Sudoku Solver":                                        { n: 37 },
  "Combination Sum":                                      { n: 39 },
  "Combination Sum II":                                   { n: 40 },
  "First Missing Positive":                               { n: 41 },
  "Trapping Rain Water":                                  { n: 42 },
  "Wildcard Matching":                                    { n: 44 },
  "Permutations":                                         { n: 46 },
  "Permutations II":                                      { n: 47 },
  "Group Anagrams":                                       { n: 49 },
  "Pow(x, n)":                                            { n: 50, slug: "powx-n" },
  "N-Queens Count":                                       { n: 51, slug: "n-queens" },
  "Maximum Subarray":                                     { n: 53 },
  "Spiral Matrix":                                        { n: 54 },
  "Merge Intervals":                                      { n: 56 },
  "Unique Paths":                                         { n: 62 },
  "Unique Paths II":                                      { n: 63 },
  "Minimum Path Sum":                                     { n: 64 },
  "Simplify Unix Path":                                   { n: 71, slug: "simplify-path" },
  "Edit Distance":                                        { n: 72 },
  "Set Matrix Zeroes":                                    { n: 73 },
  "Search a 2D Matrix":                                   { n: 74 },
  "Minimum Window Substring":                             { n: 76 },
  "Minimum Window Substring Length":                      { n: 76, slug: "minimum-window-substring" },
  "Combinations":                                         { n: 77 },
  "Subsets":                                              { n: 78 },
  "Word Search":                                          { n: 79 },
  "Remove Duplicates from Sorted List II":                { n: 82 },
  "Remove Duplicates from Sorted List":                   { n: 83 },
  "Largest Rectangle in Histogram":                       { n: 84 },
  "Partition List":                                       { n: 86 },
  "Subset II":                                            { n: 90, slug: "subsets-ii" },
  "Subsets with Duplicate Target Sum":                    { n: 90, slug: "subsets-ii" },
  "Decode Ways":                                          { n: 91 },
  "Restore IP Addresses":                                 { n: 93 },
  "Recover Binary Search Tree":                           { n: 99 },
  "Binary Tree Level Order Traversal":                    { n: 102 },
  "Construct Binary Tree from Preorder and Inorder Traversal": { n: 105 },
  "Balanced Binary Tree":                                 { n: 110 },
  "Flatten Binary Tree to Linked List":                   { n: 114 },
  "Distinct Subsequences":                                { n: 115 },
  "Best Time to Buy and Sell Stock":                      { n: 121 },
  "Longest Consecutive Sequence":                         { n: 128 },
  "Copy List with Random Pointer":                        { n: 138 },
  "Word Break":                                           { n: 139 },
  "Linked List Cycle":                                    { n: 141 },
  "Linked List Cycle II":                                 { n: 142 },
  "Reorder List":                                         { n: 143 },
  "LRU Cache":                                            { n: 146 },
  "Evaluate Reverse Polish Notation":                     { n: 150 },
  "Find Minimum in Rotated Sorted Array":                 { n: 153 },
  "Min Stack":                                            { n: 155 },
  "Min Stack Tracker":                                    { n: 155, slug: "min-stack" },
  "Binary Tree Right Side View":                          { n: 199 },
  "Number of Islands":                                    { n: 200 },
  "Course Schedule":                                      { n: 207 },
  "Topological Sort":                                     { n: 207, slug: "course-schedule" },
  "Circle Detection in Directed Graph":                   { n: 207, slug: "course-schedule" },
  "House Robber II":                                      { n: 213 },
  "Kth Largest Element in an Array":                      { n: 215 },
  "Combination Sum III":                                  { n: 216 },
  "Invert Binary Tree":                                   { n: 226 },
  "Implement Stack using Queues":                         { n: 225 },
  "Implement Queue using Stacks":                         { n: 232 },
  "Power of Two":                                         { n: 231 },
  "Lowest Common Ancestor of a Binary Tree":              { n: 236 },
  "Delete Node in a Linked List":                         { n: 237 },
  "Product of Array Except Self":                         { n: 238 },
  "Sliding Window Maximum":                               { n: 239 },
  "Missing Number":                                       { n: 268 },
  "Alien Dictionary":                                     { n: 269 },
  "Closest Binary Search Tree Value":                     { n: 270 },
  "Find the Duplicate Number":                            { n: 287 },
  "Serialize and Deserialize Binary Tree":                { n: 297 },
  "Remove Invalid Parentheses":                           { n: 301 },
  "Burst Balloons":                                       { n: 312 },
  "Super Ugly Number":                                    { n: 313 },
  "Coin Change":                                          { n: 322 },
  "Odd Even Linked List":                                 { n: 328 },
  "Longest Increasing Subsequence Length":                { n: 300, slug: "longest-increasing-subsequence" },
  "Data Stream as Disjoint Intervals":                    { n: 352 },
  "Russian Doll Envelopes":                               { n: 354 },
  "Search in Rotated Sorted Array II":                    { n: 81, slug: "search-in-rotated-sorted-array-ii" },
  "Sum of Two Integers":                                  { n: 371 },
  "Guess Number Higher or Lower":                         { n: 374 },
  "Move Zeroes":                                          { n: 283 },
  "Reverse String":                                       { n: 344 },
  "Reverse Bits":                                         { n: 190 },
  "Single Number":                                        { n: 136 },
  "Find the Celebrity":                                   { n: 277 },
  "UTF-8 Validation":                                     { n: 393 },
  "Target Sum":                                           { n: 494 },
  "Next Greater Element I":                               { n: 496 },
  "Queue Reconstruction by Height":                       { n: 406 },
  "Flatten Multilevel Doubly Linked List":                { n: 430 },
  "Path Sum III":                                         { n: 437 },
  "Find All Anagrams in a String":                        { n: 438 },
  "Split Array Largest Sum":                              { n: 410 },
  "Decode String":                                        { n: 394 },
  "Remove K Digits":                                      { n: 402 },
  "Exclusive Time of Functions":                          { n: 636 },
  "Baseball Game":                                        { n: 682 },
  "Graph Valid Tree":                                     { n: 261 },
  "Redundant Connection":                                 { n: 684 },
  "Binary Search Tree Iterator":                          { n: 173 },
  "All Paths from Root to Leaves":                        { n: 257, slug: "all-paths-from-source-to-target" },
  "Next Greater Element II":                              { n: 503 },
  "Asteroid Collision":                                   { n: 735 },
  "Delete and Earn":                                      { n: 740 },
  "Binary Search":                                        { n: 704 },
  "Palindromic Substrings":                               { n: 647 },
  "Top K Frequent Elements":                              { n: 347 },
  "Counting Bits":                                        { n: 338 },
  "Counting Bits DP":                                     { n: 338, slug: "counting-bits" },
  "Maximum Product Subarray":                             { n: 152 },
  "Maximum Product Subarray DP":                          { n: 152, slug: "maximum-product-subarray" },
  "House Robber":                                         { n: 198 },
  "Climbing Stairs":                                      { n: 70 },
  "Min Cost Climbing Stairs":                             { n: 746 },
  "Majority Element II":                                  { n: 229 },
  "Daily Temperatures":                                   { n: 739 },
  "Online Stock Span":                                    { n: 901 },
  "Validate Stack Sequences":                             { n: 946 },
  "Intersection of Two Linked Lists":                     { n: 160 },
  "Valid Anagram":                                        { n: 242 },
  "Rotate Array":                                         { n: 189 },
  "Rotating List":                                        { n: 61, slug: "rotate-list" },
  "Subarray Sum Equals K":                                { n: 560 },
  "Symmetric Tree":                                       { n: 101 },
  "Clone Graph":                                          { n: 133 },
  "Partition to K Equal Sum Subsets":                     { n: 698 },
  "Capacity To Ship Packages Within D Days":              { n: 1011 },
  "Longest Common Subsequence":                           { n: 1143 },
  "Sliding Window Median":                                { n: 480 },
  "Trapping Rain Water II":                               { n: 407 },
  "Smallest Range Covering Elements from K Lists":        { n: 632 },
  "Minimum Number of Refueling Stops":                    { n: 871 },
  "Shortest Subarray with Sum at Least K":                { n: 862 },
  "Moving Average from Data Stream":                      { n: 346 },
  "Time Based Key-Value Store":                           { n: 981 },
  "Unique Paths III":                                     { n: 980 },
  "Shortest Path in Graph with Obstacles":                { n: 1293 },
  "Minimum Spanning Tree":                                { n: 1584, slug: "min-cost-to-connect-all-points" },
  "Integer to Roman":                                     { n: 12 },
  "Permutation Sequence":                                 { n: 60 },
  "Letter Combinations of a Phone Number":                { n: 17 },
  "Palindrome Partitioning":                              { n: 131 },
  "Palindrome Partitions in Array":                       { n: 131, slug: "palindrome-partitioning" },
  "Excel Sheet Column Number":                            { n: 171 },
  "Excel Sheet Column Title":                             { n: 168 },
  "Factorial Trailing Zeros":                             { n: 172 },
  "Number of 1 Bits":                                     { n: 191 },
  "Sqrt(x)":                                              { n: 69, slug: "sqrtx" },
  "Sqrt II":                                              { n: 69, slug: "sqrtx" },
  "Add Binary":                                           { n: 67 },
  "First Bad Version":                                    { n: 278 },
  "Find Median from Data Stream":                         { n: 295 },
  "Vertical Order Traversal of a Binary Tree":            { n: 987 },
  "Middle of the Linked List":                            { n: 876 },
  "Split Linked List in Parts":                           { n: 725 },
  "Palindrome Linked List":                               { n: 234 },
  "Insert into a Sorted Circular Linked List":            { n: 708 },
  "Single Element in a Sorted Array":                     { n: 540 },
  "Longest Increasing Path in Matrix":                    { n: 329 },
  "Recover Binary Search Tree":                           { n: 99 },
  "Expression Add Operators":                             { n: 282 },
  "Maximum Depth of Binary Tree":                         { n: 104 },
  "Invert Binary Tree":                                   { n: 226 },
  "Happy Number":                                         { n: 202 },
};

// ─── Slug from title ───────────────────────────────────────────────────────────
function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// ─── Fetch raw file ────────────────────────────────────────────────────────────
async function fetchRaw(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.startsWith("404:")) return null;
    return text;
  } catch {
    return null;
  }
}

// ─── Try fetching for lang using LC num + slug variants ───────────────────────
async function fetchForLang(lcNum, title, entry, lang) {
  const num = String(lcNum).padStart(4, "0");
  const slugs = [];

  // Use explicit override first
  if (entry.slug) slugs.push(entry.slug);

  // Title-derived slug
  const derived = titleToSlug(title);
  if (!slugs.includes(derived)) slugs.push(derived);

  for (const slug of slugs) {
    const url = `${BASE_URL}/${lang.dir}/${num}-${slug}.${lang.ext}`;
    const raw = await fetchRaw(url);
    if (raw) return raw;
    await sleep(30);
  }
  return null;
}

// ─── Unwrap solutions ─────────────────────────────────────────────────────────

function unwrapPython(raw) {
  if (!raw) return null;
  const methodMatch = raw.match(/def\s+(\w+)\(self(?:,\s*([^)]*))?\)[^:]*:([\s\S]*?)(?=\n    def\s|\nclass\s|$)/);
  if (!methodMatch) return null;

  const params = (methodMatch[2] || "").trim();
  const cleanParams = params
    .split(",")
    .map(p => p.trim().replace(/\s*:.*$/, "").replace(/\s*=.*$/, "").trim())
    .filter(Boolean)
    .join(", ");

  let body = methodMatch[3];
  body = body.replace(/\n        /g, "\n    ").replace(/\n      /g, "\n    ");
  return `def solution(${cleanParams}):${body}`.trimEnd();
}

function unwrapTypeScript(raw) {
  if (!raw) return null;
  return raw
    .replace(/^export\s+/gm, "")
    .replace(/^function\s+\w+\s*\(/m, "function solution(")
    .trim();
}

function unwrapJava(raw) {
  if (!raw) return null;
  const methodMatch = raw.match(/\n    (public\s+[\w<>\[\], ]+\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?)(?=\n    public|\n})/);
  if (!methodMatch) return null;
  let method = methodMatch[1].trim();
  method = method.replace(/^(public\s+)([\w<>\[\], ]+\s+)\w+\s*\(/, "$1static $2solution(");
  if (method.startsWith("public static static")) {
    method = method.replace("public static static", "public static");
  }
  return method.trimEnd();
}

function unwrapCpp(raw) {
  if (!raw) return null;
  const methodMatch = raw.match(/\n    ([\w:<>*& \[\]]+\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?)(?=\n    [\w]|\n};)/);
  if (!methodMatch) return null;
  let method = methodMatch[1].trim();
  method = method.replace(/^([\w:<>*& \[\]]+\s+)\w+\s*\(/, "$1solution(");
  return method.trimEnd();
}

function unwrapForLang(raw, langKey) {
  if (!raw) return null;
  try {
    if (langKey === "python")     return unwrapPython(raw);
    if (langKey === "typescript") return unwrapTypeScript(raw);
    if (langKey === "java")       return unwrapJava(raw);
    if (langKey === "cpp")        return unwrapCpp(raw);
  } catch { return null; }
  return null;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"} | Lang: ${ONLY_LANG || "all 4"}\n`);

  const activeLangs = ONLY_LANG ? LANGS.filter(l => l.key === ONLY_LANG) : LANGS;

  const questions = await prisma.question.findMany({
    select: { id: true, title: true, solutions: true },
  });
  console.log(`Processing ${questions.length} questions...\n`);

  let saved = 0, skipped = 0, fetchMiss = 0, parseFail = 0;

  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    const entry = TITLE_MAP[q.title];

    if (!entry) {
      console.log(`[${qi + 1}/${questions.length}] SKIP (no mapping): ${q.title}`);
      skipped++;
      continue;
    }

    const existing = (q.solutions && typeof q.solutions === "object" && !Array.isArray(q.solutions))
      ? { ...q.solutions }
      : {};

    let updated = false;
    const results = [];

    for (const lang of activeLangs) {
      if (existing[lang.key]) {
        results.push(`${lang.key}:cached`);
        continue;
      }

      await sleep(DELAY_MS);
      const raw = await fetchForLang(entry.n, q.title, entry, lang);

      if (!raw) {
        results.push(`${lang.key}:miss`);
        fetchMiss++;
        continue;
      }

      const unwrapped = unwrapForLang(raw, lang.key);
      if (!unwrapped) {
        existing[lang.key] = raw.trim();
        results.push(`${lang.key}:raw`);
        parseFail++;
      } else {
        existing[lang.key] = unwrapped;
        results.push(`${lang.key}:ok`);
      }
      updated = true;
    }

    const line = `[${qi + 1}/${questions.length}] ${q.title} | ${results.join(", ")}`;

    if (!updated) {
      console.log(line);
      skipped++;
      continue;
    }

    if (!DRY_RUN) {
      try {
        await prisma.question.update({ where: { id: q.id }, data: { solutions: existing } });
        saved++;
        console.log(`[SAVED] ${line}`);
      } catch (err) {
        console.error(`[DB_ERR] ${q.title}: ${err.message}`);
      }
    } else {
      console.log(`[DRY] ${line}`);
      saved++;
    }
  }

  console.log(`\n──────────────────────────────`);
  console.log(`Saved: ${saved} | Skipped: ${skipped} | Miss: ${fetchMiss} | Raw fallback: ${parseFail}`);

  const all = await prisma.question.findMany({ select: { solutions: true } });
  const cov = { javascript: 0, python: 0, typescript: 0, java: 0, cpp: 0 };
  for (const q of all) {
    const s = q.solutions;
    if (s && typeof s === "object") {
      for (const lang of Object.keys(cov)) {
        if (s[lang]) cov[lang]++;
      }
    }
  }
  console.log(`\nCoverage (${all.length} total):`);
  for (const [lang, count] of Object.entries(cov)) {
    const pct = Math.round(count / all.length * 100);
    console.log(`  ${lang.padEnd(12)}: ${count}/${all.length} (${pct}%)`);
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
