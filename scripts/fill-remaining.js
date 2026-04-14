/**
 * fill-remaining.js
 *
 * Two strategies:
 *   - TypeScript: copy JS solution (JS is valid TS, just rename fn)
 *   - Python/Java/C++: hand-written translations of the specific missing problems
 *
 * Usage:
 *   node scripts/fill-remaining.js
 *   node scripts/fill-remaining.js --dry-run
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");

// ─── Hand-written solutions for non-TS-only missing problems ─────────────────
// These are problems where python/java/cpp are missing too.
const MANUAL = {
  "Reverse Linked List": {
    python: `def solution(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev`,
    java: `public static int[] solution(int[] head) {
    // Simulate with array reversal (our judge uses arrays)
    int l = 0, r = head.length - 1;
    while (l < r) {
        int tmp = head[l];
        head[l++] = head[r];
        head[r--] = tmp;
    }
    return head;
}`,
    cpp: `vector<int> solution(vector<int>& head) {
    reverse(head.begin(), head.end());
    return head;
}`,
    typescript: `function solution(head: number[]): number[] {
    let l = 0, r = head.length - 1;
    while (l < r) {
        [head[l], head[r]] = [head[r], head[l]];
        l++; r--;
    }
    return head;
}`,
  },

  "Power of Two": {
    python: `def solution(n):
    return n > 0 and (n & (n - 1)) == 0`,
    java: `public static boolean solution(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}`,
    typescript: `function solution(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0;
}`,
  },

  "Happy Sequence": {
    python: `def solution(nums):
    def is_happy(n):
        seen = set()
        while n != 1:
            if n in seen:
                return False
            seen.add(n)
            n = sum(int(d) ** 2 for d in str(n))
        return True
    return all(is_happy(x) for x in nums)`,
    java: `public static boolean solution(int[] nums) {
    for (int n : nums) {
        Set<Integer> seen = new HashSet<>();
        while (n != 1) {
            if (seen.contains(n)) return false;
            seen.add(n);
            int sum = 0;
            while (n > 0) { sum += (n % 10) * (n % 10); n /= 10; }
            n = sum;
        }
    }
    return true;
}`,
    cpp: `bool solution(vector<int>& nums) {
    auto isHappy = [](int n) {
        unordered_set<int> seen;
        while (n != 1) {
            if (seen.count(n)) return false;
            seen.insert(n);
            int sum = 0;
            while (n > 0) { sum += (n % 10) * (n % 10); n /= 10; }
            n = sum;
        }
        return true;
    };
    for (int x : nums) if (!isHappy(x)) return false;
    return true;
}`,
    typescript: `function solution(nums: number[]): boolean {
    function isHappy(n: number): boolean {
        const seen = new Set<number>();
        while (n !== 1) {
            if (seen.has(n)) return false;
            seen.add(n);
            n = String(n).split('').reduce((s, d) => s + Number(d) ** 2, 0);
        }
        return true;
    }
    return nums.every(isHappy);
}`,
  },

  "All Paths from Root to Leaves": {
    python: `def solution(root):
    res = []
    def dfs(node, path):
        if not node:
            return
        path.append(node.val)
        if not node.left and not node.right:
            res.append(list(path))
        dfs(node.left, path)
        dfs(node.right, path)
        path.pop()
    dfs(root, [])
    return res`,
    java: `public static List<List<Integer>> solution(TreeNode root) {
    List<List<Integer>> res = new ArrayList<>();
    dfs(root, new ArrayList<>(), res);
    return res;
}
private static void dfs(TreeNode node, List<Integer> path, List<List<Integer>> res) {
    if (node == null) return;
    path.add(node.val);
    if (node.left == null && node.right == null) res.add(new ArrayList<>(path));
    dfs(node.left, path, res);
    dfs(node.right, path, res);
    path.remove(path.size() - 1);
}`,
    cpp: `vector<vector<int>> solution(TreeNode* root) {
    vector<vector<int>> res;
    vector<int> path;
    function<void(TreeNode*)> dfs = [&](TreeNode* node) {
        if (!node) return;
        path.push_back(node->val);
        if (!node->left && !node->right) res.push_back(path);
        dfs(node->left);
        dfs(node->right);
        path.pop_back();
    };
    dfs(root);
    return res;
}`,
    typescript: `function solution(root: any): number[][] {
    const res: number[][] = [];
    function dfs(node: any, path: number[]): void {
        if (!node) return;
        path.push(node.val);
        if (!node.left && !node.right) res.push([...path]);
        dfs(node.left, path);
        dfs(node.right, path);
        path.pop();
    }
    dfs(root, []);
    return res;
}`,
  },

  "Factorial Trailing Zeros": {
    python: `def solution(n):
    count = 0
    while n >= 5:
        n //= 5
        count += n
    return count`,
    java: `public static int solution(int n) {
    int count = 0;
    while (n >= 5) { n /= 5; count += n; }
    return count;
}`,
    cpp: `int solution(int n) {
    int count = 0;
    while (n >= 5) { n /= 5; count += n; }
    return count;
}`,
    typescript: `function solution(n: number): number {
    let count = 0;
    while (n >= 5) { n = Math.floor(n / 5); count += n; }
    return count;
}`,
  },

  "Human Traffic of Stadium": {
    python: `def solution(records, threshold):
    high = [r for r in records if r['people'] >= threshold]
    result = []
    i = 0
    while i < len(high):
        if (i + 2 < len(high) and
            high[i+1]['id'] == high[i]['id'] + 1 and
            high[i+2]['id'] == high[i]['id'] + 2):
            j = i
            while j < len(high) and high[j]['id'] == high[i]['id'] + (j - i):
                result.append(high[j])
                j += 1
            i = j
        else:
            i += 1
    return result`,
    java: `public static List<Map<String,Object>> solution(List<Map<String,Object>> records, int threshold) {
    List<Map<String,Object>> high = new ArrayList<>();
    for (Map<String,Object> r : records)
        if ((int)r.get("people") >= threshold) high.add(r);
    List<Map<String,Object>> result = new ArrayList<>();
    int i = 0;
    while (i < high.size()) {
        if (i + 2 < high.size() &&
            (int)high.get(i+1).get("id") == (int)high.get(i).get("id") + 1 &&
            (int)high.get(i+2).get("id") == (int)high.get(i).get("id") + 2) {
            int j = i;
            while (j < high.size() && (int)high.get(j).get("id") == (int)high.get(i).get("id") + (j - i))
                result.add(high.get(j++));
            i = j;
        } else i++;
    }
    return result;
}`,
    cpp: `vector<map<string,int>> solution(vector<map<string,int>>& records, int threshold) {
    vector<map<string,int>> high;
    for (auto& r : records) if (r.at("people") >= threshold) high.push_back(r);
    vector<map<string,int>> result;
    int i = 0;
    while (i < (int)high.size()) {
        if (i + 2 < (int)high.size() &&
            high[i+1]["id"] == high[i]["id"] + 1 &&
            high[i+2]["id"] == high[i]["id"] + 2) {
            int j = i;
            while (j < (int)high.size() && high[j]["id"] == high[i]["id"] + (j - i))
                result.push_back(high[j++]);
            i = j;
        } else i++;
    }
    return result;
}`,
    typescript: `function solution(records: {id:number,people:number}[], threshold: number): {id:number,people:number}[] {
    const high = records.filter(r => r.people >= threshold);
    const result: {id:number,people:number}[] = [];
    let i = 0;
    while (i < high.length) {
        if (i + 2 < high.length &&
            high[i+1].id === high[i].id + 1 &&
            high[i+2].id === high[i].id + 2) {
            let j = i;
            while (j < high.length && high[j].id === high[i].id + (j - i))
                result.push(high[j++]);
            i = j;
        } else i++;
    }
    return result;
}`,
  },

  "Permutations II": {
    cpp: `vector<vector<int>> solution(vector<int>& nums) {
    sort(nums.begin(), nums.end());
    vector<vector<int>> res;
    vector<bool> used(nums.size(), false);
    vector<int> path;
    function<void()> bt = [&]() {
        if (path.size() == nums.size()) { res.push_back(path); return; }
        for (int i = 0; i < (int)nums.size(); i++) {
            if (used[i]) continue;
            if (i > 0 && nums[i] == nums[i-1] && !used[i-1]) continue;
            used[i] = true;
            path.push_back(nums[i]);
            bt();
            path.pop_back();
            used[i] = false;
        }
    };
    bt();
    return res;
}`,
  },
};

// ─── TS fallback: convert JS solution to TS ───────────────────────────────────
// JS is valid TS — just change `function solution(` signature comment
function jsToTs(jsCode) {
  // Already valid TS — just return as-is (no type annotations needed for judge)
  return jsCode;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

  const questions = await prisma.question.findMany({
    select: { id: true, title: true, solutions: true },
  });

  const toProcess = questions.filter(q => {
    const s = q.solutions || {};
    return !s.typescript || !s.python || !s.java || !s.cpp;
  });

  console.log(`Questions needing fill: ${toProcess.length}\n`);

  let saved = 0;

  for (const q of toProcess) {
    const existing = (q.solutions && typeof q.solutions === "object" && !Array.isArray(q.solutions))
      ? { ...q.solutions }
      : {};

    const results = [];
    let updated = false;

    // TS: copy from JS if missing
    if (!existing.typescript && existing.javascript) {
      // Check MANUAL first
      if (MANUAL[q.title]?.typescript) {
        existing.typescript = MANUAL[q.title].typescript;
      } else {
        existing.typescript = jsToTs(existing.javascript);
      }
      results.push("typescript:js_copy");
      updated = true;
    }

    // Python/Java/C++: use MANUAL if available
    for (const lang of ["python", "java", "cpp"]) {
      if (!existing[lang]) {
        if (MANUAL[q.title]?.[lang]) {
          existing[lang] = MANUAL[q.title][lang];
          results.push(`${lang}:manual`);
          updated = true;
        } else {
          results.push(`${lang}:no_solution`);
        }
      }
    }

    if (!updated) continue;

    const line = `${q.title} | ${results.join(", ")}`;

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

  console.log(`\nSaved: ${saved}`);

  const all = await prisma.question.findMany({ select: { solutions: true } });
  const cov = { javascript: 0, python: 0, typescript: 0, java: 0, cpp: 0 };
  for (const q of all) {
    const s = q.solutions;
    if (s && typeof s === "object") {
      for (const lang of Object.keys(cov)) if (s[lang]) cov[lang]++;
    }
  }
  console.log(`\nFinal coverage (${all.length} total):`);
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
