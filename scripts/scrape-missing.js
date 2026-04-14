/**
 * scrape-missing.js
 *
 * Fills gaps for java + cpp using doocs/leetcode (primary) + kamyu104 (cpp fallback).
 * Only runs on questions that are missing java or cpp solutions.
 * Merges into existing `solutions` Json map.
 *
 * Usage:
 *   node scripts/scrape-missing.js
 *   node scripts/scrape-missing.js --dry-run
 *   node scripts/scrape-missing.js --lang java
 *   node scripts/scrape-missing.js --lang cpp
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");
const ONLY_LANG = (() => {
  const idx = process.argv.indexOf("--lang");
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

const DELAY_MS = 120;
const DOOCS_BASE = "https://raw.githubusercontent.com/doocs/leetcode/main/solution";
const KAMYU_CPP  = "https://raw.githubusercontent.com/kamyu104/LeetCode-Solutions/master/C++";

// ─── Title → LC number + doocs folder title (URL-encoded space) ───────────────
// doocs folder: "{num}.{Title}" where Title matches problem title with spaces
const TITLE_MAP = {
  "Wildcard Matching":                          { n: 44,  t: "Wildcard Matching" },
  "Next Permutation":                           { n: 31,  t: "Next Permutation" },
  "Implement Queue using Stacks":               { n: 232, t: "Implement Queue using Stacks" },
  "Expression Add Operators":                   { n: 282, t: "Expression Add Operators" },
  "Vertical Order Traversal of a Binary Tree":  { n: 987, t: "Vertical Order Traversal of a Binary Tree" },
  "Longest Increasing Path in Matrix":          { n: 329, t: "Longest Increasing Path in a Matrix" },
  "Remove Invalid Parentheses":                 { n: 301, t: "Remove Invalid Parentheses" },
  "Sliding Window Median":                      { n: 480, t: "Sliding Window Median" },
  "Data Stream as Disjoint Intervals":          { n: 352, t: "Data Stream as Disjoint Intervals" },
  "Minimum Number of Refueling Stops":          { n: 871, t: "Minimum Number of Refueling Stops" },
  "Smallest Range Covering Elements from K Lists": { n: 632, t: "Smallest Range Covering Elements from K Lists" },
  "Excel Sheet Column Number":                  { n: 171, t: "Excel Sheet Column Number" },
  "Restore IP Addresses":                       { n: 93,  t: "Restore IP Addresses" },
  "Combination Sum III":                        { n: 216, t: "Combination Sum III" },
  "Unique Paths III":                           { n: 980, t: "Unique Paths III" },
  "Super Ugly Number":                          { n: 313, t: "Super Ugly Number" },
  "Longest Valid Parentheses":                  { n: 32,  t: "Longest Valid Parentheses" },
  "Delete Node in a Linked List":               { n: 237, t: "Delete Node in a Linked List" },
  "Russian Doll Envelopes":                     { n: 354, t: "Russian Doll Envelopes" },
  "Divide Two Integers":                        { n: 29,  t: "Divide Two Integers" },
  "UTF-8 Validation":                           { n: 393, t: "UTF-8 Validation" },
  "Odd Even Linked List":                       { n: 328, t: "Odd Even Linked List" },
  "Remove Duplicates from Sorted List II":      { n: 82,  t: "Remove Duplicates from Sorted List II" },
  "Next Greater Element II":                    { n: 503, t: "Next Greater Element II" },
  "Moving Average from Data Stream":            { n: 346, t: "Moving Average from Data Stream" },
  "Queue Reconstruction by Height":             { n: 406, t: "Queue Reconstruction by Height" },
  "Trapping Rain Water II":                     { n: 407, t: "Trapping Rain Water II" },
  "Shortest Subarray with Sum at Least K":      { n: 862, t: "Shortest Subarray with Sum at Least K" },
  "Recover Binary Search Tree":                 { n: 99,  t: "Recover Binary Search Tree" },
  "Shortest Path in Graph with Obstacles":      { n: 1293,t: "Shortest Path in a Grid with Obstacles Elimination" },
  "Longest Substring Without Repeating":        { n: 3,   t: "Longest Substring Without Repeating Characters" },
  "Flatten Multilevel Doubly Linked List":      { n: 430, t: "Flatten a Multilevel Doubly Linked List" },
  "Exclusive Time of Functions":                { n: 636, t: "Exclusive Time of Functions" },
  "Path Sum III":                               { n: 437, t: "Path Sum III" },
  "Flatten Binary Tree to Linked List":         { n: 114, t: "Flatten Binary Tree to Linked List" },
  "All Paths from Root to Leaves":              { n: 257, t: "All Paths From Root to Leaves" },
  "Closest Binary Search Tree Value":           { n: 270, t: "Closest Binary Search Tree Value" },
  "Factorial Trailing Zeros":                   { n: 172, t: "Factorial Trailing Zeros" },
  "Find the Celebrity":                         { n: 277, t: "Find the Celebrity" },
  // Also fill gaps for python + typescript that NeetCode missed
  "Majority Element II":                        { n: 229, t: "Majority Element II" },
  "Linked List Cycle II":                       { n: 142, t: "Linked List Cycle II" },
  "Intersection of Two Linked Lists":           { n: 160, t: "Intersection of Two Linked Lists" },
  "Remove Duplicates from Sorted List":         { n: 83,  t: "Remove Duplicates from Sorted List" },
  "Combinations":                               { n: 77,  t: "Combinations" },
  "Implement Stack using Queues":               { n: 225, t: "Implement Stack using Queues" },
  "Partition List":                             { n: 86,  t: "Partition List" },
  "Swap Nodes in Pairs":                        { n: 24,  t: "Swap Nodes in Pairs" },
  "Rotating List":                              { n: 61,  t: "Rotate List" },
  "Binary Search Tree Iterator":                { n: 173, t: "Binary Search Tree Iterator" },
  "Symmetric Tree":                             { n: 101, t: "Symmetric Tree" },
  "Lowest Common Ancestor of a Binary Tree":    { n: 236, t: "Lowest Common Ancestor of a Binary Tree" },
  "Palindrome Linked List":                     { n: 234, t: "Palindrome Linked List" },
  "Unique Paths II":                            { n: 63,  t: "Unique Paths II" },
  "Minimum Path Sum":                           { n: 64,  t: "Minimum Path Sum" },
  "First Bad Version":                          { n: 278, t: "First Bad Version" },
  "Capacity To Ship Packages Within D Days":    { n: 1011,t: "Capacity To Ship Packages Within D Days" },
  "Search in Rotated Sorted Array II":          { n: 81,  t: "Search in Rotated Sorted Array II" },
  "Partition to K Equal Sum Subsets":           { n: 698, t: "Partition to K Equal Sum Subsets" },
  "Sqrt(x)":                                    { n: 69,  t: "Sqrt(x)" },
  "Sqrt II":                                    { n: 69,  t: "Sqrt(x)" },
  "Excel Sheet Column Title":                   { n: 168, t: "Excel Sheet Column Title" },
  "Permutation Sequence":                       { n: 60,  t: "Permutation Sequence" },
  "Sudoku Solver":                              { n: 37,  t: "Sudoku Solver" },
  "Delete and Earn":                            { n: 740, t: "Delete and Earn" },
  "Alien Dictionary":                           { n: 269, t: "Alien Dictionary" },
  "Split Linked List in Parts":                 { n: 725, t: "Split Linked List in Parts" },
  "Insert into a Sorted Circular Linked List":  { n: 708, t: "Insert into a Sorted Circular Linked List" },
  "Shortest Subarray with Sum at Least K":      { n: 862, t: "Shortest Subarray with Sum at Least K" },
  "Validate Stack Sequences":                   { n: 946, t: "Validate Stack Sequences" },
  "Guess Number Higher or Lower":               { n: 374, t: "Guess Number Higher or Lower" },
  "Split Array Largest Sum":                    { n: 410, t: "Split Array Largest Sum" },
  "Closest Binary Search Tree Value":           { n: 270, t: "Closest Binary Search Tree Value" },
  "Super Ugly Number":                          { n: 313, t: "Super Ugly Number" },
};

// kamyu104 slug: lowercase, spaces → hyphens, remove special chars
function toKamyuSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-");
}

// doocs folder range: floor(n/100)*100 → padded e.g. 0300-0399
function doocsRange(n) {
  const lo = Math.floor(n / 100) * 100;
  const hi = lo + 99;
  return `${String(lo).padStart(4, "0")}-${String(hi).padStart(4, "0")}`;
}

// doocs folder name: "{padded_num}.{title}"
function doocsFolder(n, title) {
  const num = String(n).padStart(4, "0");
  return `${num}.${title}`;
}

async function fetchRaw(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.startsWith("404:")) return null;
    return text;
  } catch { return null; }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Unwrappers ───────────────────────────────────────────────────────────────

function unwrapJava(raw) {
  if (!raw) return null;
  // doocs Java: clean class Solution { public X methodName(...) { ... } }
  const methodMatch = raw.match(/\n    (public\s+[\w<>\[\], ]+\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?)(?=\n    public|\n})/);
  if (!methodMatch) return null;
  let method = methodMatch[1].trim();
  // Rename first method to solution + make static
  method = method.replace(/^(public\s+)([\w<>\[\], ]+\s+)\w+\s*\(/, "$1static $2solution(");
  return method.trimEnd();
}

function unwrapCpp(raw) {
  if (!raw) return null;
  // Try doocs/neetcode style: method inside class Solution
  const methodMatch = raw.match(/\n    ([\w:<>*& \[\]]+\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?)(?=\n    [\w]|\n};)/);
  if (methodMatch) {
    let method = methodMatch[1].trim();
    method = method.replace(/^([\w:<>*& \[\]]+\s+)\w+\s*\(/, "$1solution(");
    return method.trimEnd();
  }
  // kamyu104 style: standalone function or method
  const standalone = raw.match(/^([\w:<>*& \[\]]+\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\n\})/m);
  if (standalone) {
    let method = standalone[1].trim();
    method = method.replace(/^([\w:<>*& \[\]]+\s+)\w+\s*\(/, "$1solution(");
    return method.trimEnd();
  }
  return null;
}

// ─── Fetch for a question from doocs (primary) + kamyu104 (cpp fallback) ─────
async function fetchDoocs(n, title, langExt) {
  const range = doocsRange(n);
  const folder = doocsFolder(n, title);
  const url = `${DOOCS_BASE}/${range}/${encodeURIComponent(folder)}/Solution.${langExt}`;
  return await fetchRaw(url);
}

async function fetchKamyu(title) {
  const slug = toKamyuSlug(title);
  const url = `${KAMYU_CPP}/${slug}.cpp`;
  return await fetchRaw(url);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"} | Lang: ${ONLY_LANG || "java + cpp"}\n`);

  const targetLangs = ONLY_LANG
    ? [ONLY_LANG]
    : ["java", "cpp", "python", "typescript"];

  const langExts = { java: "java", cpp: "cpp", python: "py", typescript: "ts" };

  const questions = await prisma.question.findMany({
    select: { id: true, title: true, solutions: true },
  });

  // Only process questions missing at least one target lang
  const toProcess = questions.filter(q => {
    const s = q.solutions || {};
    return targetLangs.some(l => !s[l]);
  });

  console.log(`Questions needing fill: ${toProcess.length} / ${questions.length}\n`);

  let saved = 0, miss = 0, parseFail = 0;

  for (let qi = 0; qi < toProcess.length; qi++) {
    const q = toProcess[qi];
    const entry = TITLE_MAP[q.title];

    if (!entry) {
      console.log(`[${qi + 1}/${toProcess.length}] SKIP: ${q.title}`);
      continue;
    }

    const existing = (q.solutions && typeof q.solutions === "object" && !Array.isArray(q.solutions))
      ? { ...q.solutions }
      : {};

    let updated = false;
    const results = [];

    for (const lang of targetLangs) {
      if (existing[lang]) {
        results.push(`${lang}:cached`);
        continue;
      }

      await sleep(DELAY_MS);
      let raw = await fetchDoocs(entry.n, entry.t, langExts[lang]);

      // C++ fallback: kamyu104
      if (!raw && lang === "cpp") {
        await sleep(DELAY_MS);
        raw = await fetchKamyu(q.title);
      }

      if (!raw) {
        results.push(`${lang}:miss`);
        miss++;
        continue;
      }

      let unwrapped = null;
      if (lang === "java")       unwrapped = unwrapJava(raw);
      if (lang === "cpp")        unwrapped = unwrapCpp(raw);
      if (lang === "python") {
        // Use same python unwrap logic
        const methodMatch = raw.match(/def\s+(\w+)\(self(?:,\s*([^)]*))?\)[^:]*:([\s\S]*?)(?=\n    def\s|\nclass\s|$)/);
        if (methodMatch) {
          const params = (methodMatch[2] || "").trim()
            .split(",").map(p => p.trim().replace(/\s*:.*$/, "").replace(/\s*=.*$/, "").trim()).filter(Boolean).join(", ");
          let body = methodMatch[3];
          body = body.replace(/\n        /g, "\n    ").replace(/\n      /g, "\n    ");
          unwrapped = `def solution(${params}):${body}`.trimEnd();
        }
      }
      if (lang === "typescript") {
        unwrapped = raw.replace(/^export\s+/gm, "").replace(/^function\s+\w+\s*\(/m, "function solution(").trim();
      }

      if (!unwrapped) {
        existing[lang] = raw.trim();
        results.push(`${lang}:raw`);
        parseFail++;
      } else {
        existing[lang] = unwrapped;
        results.push(`${lang}:ok`);
      }
      updated = true;
    }

    const line = `[${qi + 1}/${toProcess.length}] ${q.title} | ${results.join(", ")}`;

    if (!updated) {
      console.log(line);
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
  console.log(`Saved: ${saved} | Miss: ${miss} | Raw fallback: ${parseFail}`);

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
