/**
 * tests/judge/problems-multilang.test.js
 *
 * Runs every problem in prisma/questions_bank/ through the judge in all four
 * UI languages: JavaScript, Python, C++, Java.
 *
 * Usage:
 *   node tests/judge/problems-multilang.test.js
 *   node tests/judge/problems-multilang.test.js --lang cpp
 *   node tests/judge/problems-multilang.test.js --filter "Two Sum"
 *   node tests/judge/problems-multilang.test.js --category trees_graphs
 *   node tests/judge/problems-multilang.test.js --lang cpp --category backtracking_recursion
 *
 * Each SOLUTIONS entry is keyed by problem title and contains sub-keys for
 * each language: "javascript", "python", "cpp", "java".
 */

"use strict";

const path = require("path");
const fs = require("fs");
const { executeCode } = require("../../server/services/judgeService");

// ─── helpers ──────────────────────────────────────────────────────────────────

const BANK_DIR = path.join(__dirname, "../../prisma/questions_bank");
const LANGS = ["javascript", "python", "cpp", "java"];

function walkJsonFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkJsonFiles(full));
    else if (entry.name.endsWith(".json")) results.push(full);
  }
  return results;
}

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

// ─── solutions ────────────────────────────────────────────────────────────────

const SOLUTIONS = {

  // ── Two Sum ─────────────────────────────────────────────────────────────────
  "Two Sum": {
    javascript: `
function solution(nums, target) {
  const map = {};
  for (let i = 0; i < nums.length; i++) {
    const c = target - nums[i];
    if (map[c] !== undefined) return [map[c], i];
    map[nums[i]] = i;
  }
  return [];
}`,
    python: `
def solution(nums, target):
    seen = {}
    for i, v in enumerate(nums):
        c = target - v
        if c in seen:
            return [seen[c], i]
        seen[v] = i
    return []`,
    cpp: `
#include <unordered_map>
vector<int> solution(vector<int> nums, int target) {
    unordered_map<int,int> mp;
    for (int i = 0; i < (int)nums.size(); i++) {
        int c = target - nums[i];
        if (mp.count(c)) return {mp[c], i};
        mp[nums[i]] = i;
    }
    return {};
}`,
    java: `
class Solution {
    public int[] solution(int[] nums, int target) {
        java.util.HashMap<Integer,Integer> map = new java.util.HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int c = target - nums[i];
            if (map.containsKey(c)) return new int[]{map.get(c), i};
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
  },

  // ── Best Time to Buy and Sell Stock ─────────────────────────────────────────
  "Best Time to Buy and Sell Stock": {
    javascript: `
function solution(prices) {
  let min = Infinity, best = 0;
  for (const p of prices) { best = Math.max(best, p - min); min = Math.min(min, p); }
  return best;
}`,
    python: `
def solution(prices):
    mn, best = float('inf'), 0
    for p in prices:
        best = max(best, p - mn)
        mn = min(mn, p)
    return best`,
    cpp: `
int solution(vector<int> prices) {
    int mn = INT_MAX, best = 0;
    for (int p : prices) { best = max(best, p - mn); mn = min(mn, p); }
    return best;
}`,
    java: `
class Solution {
    public int solution(int[] prices) {
        int mn = Integer.MAX_VALUE, best = 0;
        for (int p : prices) { best = Math.max(best, p - mn); mn = Math.min(mn, p); }
        return best;
    }
}`,
  },

  // ── Longest Substring Without Repeating Characters ──────────────────────────
  "Longest Substring Without Repeating Characters": {
    javascript: `
function solution(s) {
  const seen = {}; let left = 0, best = 0;
  for (let r = 0; r < s.length; r++) {
    if (seen[s[r]] >= left) left = seen[s[r]] + 1;
    seen[s[r]] = r;
    best = Math.max(best, r - left + 1);
  }
  return best;
}`,
    python: `
def solution(s):
    seen = {}; left = best = 0
    for r, c in enumerate(s):
        if c in seen and seen[c] >= left:
            left = seen[c] + 1
        seen[c] = r
        best = max(best, r - left + 1)
    return best`,
    cpp: `
int solution(string s) {
    unordered_map<char,int> seen;
    int left = 0, best = 0;
    for (int r = 0; r < (int)s.size(); r++) {
        if (seen.count(s[r]) && seen[s[r]] >= left) left = seen[s[r]] + 1;
        seen[s[r]] = r;
        best = max(best, r - left + 1);
    }
    return best;
}`,
    java: `
class Solution {
    public int solution(String s) {
        java.util.HashMap<Character,Integer> seen = new java.util.HashMap<>();
        int left = 0, best = 0;
        for (int r = 0; r < s.length(); r++) {
            char c = s.charAt(r);
            if (seen.containsKey(c) && seen.get(c) >= left) left = seen.get(c) + 1;
            seen.put(c, r);
            best = Math.max(best, r - left + 1);
        }
        return best;
    }
}`,
  },

  // ── Container With Most Water ────────────────────────────────────────────────
  "Container With Most Water": {
    javascript: `
function solution(height) {
  let l = 0, r = height.length - 1, best = 0;
  while (l < r) {
    best = Math.max(best, Math.min(height[l], height[r]) * (r - l));
    if (height[l] < height[r]) l++; else r--;
  }
  return best;
}`,
    python: `
def solution(height):
    l, r, best = 0, len(height)-1, 0
    while l < r:
        best = max(best, min(height[l], height[r]) * (r - l))
        if height[l] < height[r]: l += 1
        else: r -= 1
    return best`,
    cpp: `
int solution(vector<int> height) {
    int l = 0, r = (int)height.size()-1, best = 0;
    while (l < r) {
        best = max(best, min(height[l], height[r]) * (r - l));
        if (height[l] < height[r]) l++; else r--;
    }
    return best;
}`,
    java: `
class Solution {
    public int solution(int[] height) {
        int l = 0, r = height.length-1, best = 0;
        while (l < r) {
            best = Math.max(best, Math.min(height[l], height[r]) * (r - l));
            if (height[l] < height[r]) l++; else r--;
        }
        return best;
    }
}`,
  },

  // ── Trapping Rain Water ──────────────────────────────────────────────────────
  "Trapping Rain Water": {
    javascript: `
function solution(height) {
  let l=0,r=height.length-1,lMax=0,rMax=0,water=0;
  while(l<r){
    if(height[l]<height[r]){if(height[l]>=lMax)lMax=height[l];else water+=lMax-height[l];l++;}
    else{if(height[r]>=rMax)rMax=height[r];else water+=rMax-height[r];r--;}
  }
  return water;
}`,
    python: `
def solution(height):
    l,r,lm,rm,w=0,len(height)-1,0,0,0
    while l<r:
        if height[l]<height[r]:
            if height[l]>=lm: lm=height[l]
            else: w+=lm-height[l]
            l+=1
        else:
            if height[r]>=rm: rm=height[r]
            else: w+=rm-height[r]
            r-=1
    return w`,
    cpp: `
int solution(vector<int> height) {
    int l=0,r=(int)height.size()-1,lm=0,rm=0,w=0;
    while(l<r){
        if(height[l]<height[r]){if(height[l]>=lm)lm=height[l];else w+=lm-height[l];l++;}
        else{if(height[r]>=rm)rm=height[r];else w+=rm-height[r];r--;}
    }
    return w;
}`,
    java: `
class Solution {
    public int solution(int[] height) {
        int l=0,r=height.length-1,lm=0,rm=0,w=0;
        while(l<r){
            if(height[l]<height[r]){if(height[l]>=lm)lm=height[l];else w+=lm-height[l];l++;}
            else{if(height[r]>=rm)rm=height[r];else w+=rm-height[r];r--;}
        }
        return w;
    }
}`,
  },

  // ── Subsets ──────────────────────────────────────────────────────────────────
  Subsets: {
    javascript: `
function solution(nums) {
  const res=[];
  function bt(s,cur){
    res.push([...cur]);
    for(let i=s;i<nums.length;i++){cur.push(nums[i]);bt(i+1,cur);cur.pop();}
  }
  bt(0,[]);return res;
}`,
    python: `
def solution(nums):
    res=[]
    def bt(s,cur):
        res.append(cur[:])
        for i in range(s,len(nums)):
            cur.append(nums[i]);bt(i+1,cur);cur.pop()
    bt(0,[]);return res`,
    cpp: `
vector<vector<int>> solution(vector<int> nums) {
    vector<vector<int>> res;
    vector<int> cur;
    function<void(int)> bt=[&](int s){
        res.push_back(cur);
        for(int i=s;i<(int)nums.size();i++){cur.push_back(nums[i]);bt(i+1);cur.pop_back();}
    };
    bt(0);return res;
}`,
    java: `
class Solution {
    public int[][] solution(int[] nums) {
        java.util.List<int[]> res = new java.util.ArrayList<>();
        java.util.List<Integer> cur = new java.util.ArrayList<>();
        bt(nums, 0, cur, res);
        return res.toArray(new int[0][]);
    }
    void bt(int[] nums, int s, java.util.List<Integer> cur, java.util.List<int[]> res) {
        res.add(cur.stream().mapToInt(Integer::intValue).toArray());
        for(int i=s;i<nums.length;i++){cur.add(nums[i]);bt(nums,i+1,cur,res);cur.remove(cur.size()-1);}
    }
}`,
  },

  // ── Permutations ─────────────────────────────────────────────────────────────
  Permutations: {
    javascript: `
function solution(nums) {
  const res=[];
  function bt(cur,used){
    if(cur.length===nums.length){res.push([...cur]);return;}
    for(let i=0;i<nums.length;i++){
      if(used[i])continue;used[i]=true;cur.push(nums[i]);bt(cur,used);cur.pop();used[i]=false;
    }
  }
  bt([],{});return res;
}`,
    python: `
def solution(nums):
    res=[]
    used=[False]*len(nums)
    def bt(cur):
        if len(cur)==len(nums):res.append(cur[:]);return
        for i in range(len(nums)):
            if used[i]:continue
            used[i]=True;cur.append(nums[i]);bt(cur);cur.pop();used[i]=False
    bt([]);return res`,
    cpp: `
vector<vector<int>> solution(vector<int> nums) {
    vector<vector<int>> res;
    vector<int> cur;
    vector<bool> used(nums.size(),false);
    function<void()> bt=[&](){
        if(cur.size()==nums.size()){res.push_back(cur);return;}
        for(int i=0;i<(int)nums.size();i++){
            if(used[i])continue;used[i]=true;cur.push_back(nums[i]);bt();cur.pop_back();used[i]=false;
        }
    };
    bt();return res;
}`,
    java: `
class Solution {
    public int[][] solution(int[] nums) {
        java.util.List<int[]> res = new java.util.ArrayList<>();
        bt(nums, new java.util.ArrayList<>(), new boolean[nums.length], res);
        return res.toArray(new int[0][]);
    }
    void bt(int[] nums, java.util.List<Integer> cur, boolean[] used, java.util.List<int[]> res) {
        if(cur.size()==nums.length){res.add(cur.stream().mapToInt(Integer::intValue).toArray());return;}
        for(int i=0;i<nums.length;i++){
            if(used[i])continue;used[i]=true;cur.add(nums[i]);bt(nums,cur,used,res);cur.remove(cur.size()-1);used[i]=false;
        }
    }
}`,
  },

  // ── Combination Sum ──────────────────────────────────────────────────────────
  "Combination Sum": {
    javascript: `
function solution(candidates, target) {
  candidates.sort((a,b)=>a-b);
  const res=[];
  function bt(s,rem,cur){
    if(rem===0){res.push([...cur]);return;}
    for(let i=s;i<candidates.length;i++){
      if(candidates[i]>rem)break;
      cur.push(candidates[i]);bt(i,rem-candidates[i],cur);cur.pop();
    }
  }
  bt(0,target,[]);return res;
}`,
    python: `
def solution(candidates, target):
    candidates.sort();res=[]
    def bt(s,rem,cur):
        if rem==0:res.append(cur[:]);return
        for i in range(s,len(candidates)):
            if candidates[i]>rem:break
            cur.append(candidates[i]);bt(i,rem-candidates[i],cur);cur.pop()
    bt(0,target,[]);return res`,
    cpp: `
vector<vector<int>> solution(vector<int> candidates, int target) {
    sort(candidates.begin(),candidates.end());
    vector<vector<int>> res;
    vector<int> cur;
    function<void(int,int)> bt=[&](int s,int rem){
        if(rem==0){res.push_back(cur);return;}
        for(int i=s;i<(int)candidates.size();i++){
            if(candidates[i]>rem)break;
            cur.push_back(candidates[i]);bt(i,rem-candidates[i]);cur.pop_back();
        }
    };
    bt(0,target);return res;
}`,
    java: `
class Solution {
    public int[][] solution(int[] candidates, int target) {
        java.util.Arrays.sort(candidates);
        java.util.List<int[]> res = new java.util.ArrayList<>();
        bt(candidates, target, 0, new java.util.ArrayList<>(), res);
        return res.toArray(new int[0][]);
    }
    void bt(int[] c, int rem, int s, java.util.List<Integer> cur, java.util.List<int[]> res) {
        if(rem==0){res.add(cur.stream().mapToInt(Integer::intValue).toArray());return;}
        for(int i=s;i<c.length;i++){
            if(c[i]>rem)break;
            cur.add(c[i]);bt(c,rem-c[i],i,cur,res);cur.remove(cur.size()-1);
        }
    }
}`,
  },

  // ── N-Queens Count ───────────────────────────────────────────────────────────
  "N-Queens Count": {
    javascript: `
function solution(n) {
  let count=0;
  const cols=new Set(),d1=new Set(),d2=new Set();
  function bt(row){
    if(row===n){count++;return;}
    for(let c=0;c<n;c++){
      if(cols.has(c)||d1.has(row-c)||d2.has(row+c))continue;
      cols.add(c);d1.add(row-c);d2.add(row+c);bt(row+1);
      cols.delete(c);d1.delete(row-c);d2.delete(row+c);
    }
  }
  bt(0);return count;
}`,
    python: `
def solution(n):
    count=[0]
    def bt(row,cols,d1,d2):
        if row==n:count[0]+=1;return
        for c in range(n):
            if c in cols or row-c in d1 or row+c in d2:continue
            cols.add(c);d1.add(row-c);d2.add(row+c)
            bt(row+1,cols,d1,d2)
            cols.remove(c);d1.remove(row-c);d2.remove(row+c)
    bt(0,set(),set(),set());return count[0]`,
    cpp: `
int solution(int n) {
    int count=0;
    vector<bool> cols(n,false);
    vector<bool> d1(2*n,false),d2(2*n,false);
    function<void(int)> bt=[&](int row){
        if(row==n){count++;return;}
        for(int c=0;c<n;c++){
            if(cols[c]||d1[row-c+n]||d2[row+c])continue;
            cols[c]=d1[row-c+n]=d2[row+c]=true;bt(row+1);
            cols[c]=d1[row-c+n]=d2[row+c]=false;
        }
    };
    bt(0);return count;
}`,
    java: `
class Solution {
    int count=0;
    public int solution(int n) {
        count=0;
        bt(n,0,new boolean[n],new boolean[2*n],new boolean[2*n]);
        return count;
    }
    void bt(int n,int row,boolean[] cols,boolean[] d1,boolean[] d2){
        if(row==n){count++;return;}
        for(int c=0;c<n;c++){
            if(cols[c]||d1[row-c+n]||d2[row+c])continue;
            cols[c]=d1[row-c+n]=d2[row+c]=true;bt(n,row+1,cols,d1,d2);
            cols[c]=d1[row-c+n]=d2[row+c]=false;
        }
    }
}`,
  },

  // ── Word Search ──────────────────────────────────────────────────────────────
  "Word Search": {
    javascript: `
function solution(board, word) {
  const R=board.length,C=board[0].length;
  function dfs(r,c,k){
    if(k===word.length)return true;
    if(r<0||r>=R||c<0||c>=C||board[r][c]!==word[k])return false;
    const tmp=board[r][c];board[r][c]='#';
    const f=dfs(r+1,c,k+1)||dfs(r-1,c,k+1)||dfs(r,c+1,k+1)||dfs(r,c-1,k+1);
    board[r][c]=tmp;return f;
  }
  for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(dfs(r,c,0))return true;
  return false;
}`,
    python: `
def solution(board, word):
    R,C=len(board),len(board[0])
    def dfs(r,c,k):
        if k==len(word):return True
        if r<0 or r>=R or c<0 or c>=C or board[r][c]!=word[k]:return False
        tmp=board[r][c];board[r][c]='#'
        f=dfs(r+1,c,k+1) or dfs(r-1,c,k+1) or dfs(r,c+1,k+1) or dfs(r,c-1,k+1)
        board[r][c]=tmp;return f
    for r in range(R):
        for c in range(C):
            if dfs(r,c,0):return True
    return False`,
    cpp: `
bool solution(vector<vector<string>> board, string word) {
    int R=board.size(),C=board[0].size();
    function<bool(int,int,int)> dfs=[&](int r,int c,int k)->bool{
        if(k==(int)word.size())return true;
        if(r<0||r>=R||c<0||c>=C||board[r][c][0]!=word[k])return false;
        char tmp=board[r][c][0];board[r][c]="#";
        bool f=dfs(r+1,c,k+1)||dfs(r-1,c,k+1)||dfs(r,c+1,k+1)||dfs(r,c-1,k+1);
        board[r][c]=string(1,tmp);return f;
    };
    for(int r=0;r<R;r++)for(int c=0;c<C;c++)if(dfs(r,c,0))return true;
    return false;
}`,
    java: `
class Solution {
    public boolean solution(String[][] board, String word) {
        int R=board.length,C=board[0].length;
        for(int r=0;r<R;r++)for(int c=0;c<C;c++)if(dfs(board,word,r,c,0))return true;
        return false;
    }
    boolean dfs(String[][] b,String w,int r,int c,int k){
        if(k==w.length())return true;
        if(r<0||r>=b.length||c<0||c>=b[0].length||!b[r][c].equals(String.valueOf(w.charAt(k))))return false;
        String tmp=b[r][c];b[r][c]="#";
        boolean f=dfs(b,w,r+1,c,k+1)||dfs(b,w,r-1,c,k+1)||dfs(b,w,r,c+1,k+1)||dfs(b,w,r,c-1,k+1);
        b[r][c]=tmp;return f;
    }
}`,
  },

  // ── Binary Search ────────────────────────────────────────────────────────────
  "Binary Search": {
    javascript: `
function solution(nums,target){let l=0,r=nums.length-1;while(l<=r){const m=(l+r)>>1;if(nums[m]===target)return m;if(nums[m]<target)l=m+1;else r=m-1;}return -1;}`,
    python: `
def solution(nums,target):
    l,r=0,len(nums)-1
    while l<=r:
        m=(l+r)//2
        if nums[m]==target:return m
        if nums[m]<target:l=m+1
        else:r=m-1
    return -1`,
    cpp: `
int solution(vector<int> nums,int target){int l=0,r=(int)nums.size()-1;while(l<=r){int m=(l+r)/2;if(nums[m]==target)return m;if(nums[m]<target)l=m+1;else r=m-1;}return -1;}`,
    java: `
class Solution{public int solution(int[] nums,int target){int l=0,r=nums.length-1;while(l<=r){int m=(l+r)/2;if(nums[m]==target)return m;if(nums[m]<target)l=m+1;else r=m-1;}return -1;}}`,
  },

  // ── Search Insert Position ───────────────────────────────────────────────────
  "Search Insert Position": {
    javascript: `function solution(nums,target){let l=0,r=nums.length;while(l<r){const m=(l+r)>>1;if(nums[m]<target)l=m+1;else r=m;}return l;}`,
    python: `
def solution(nums,target):
    l,r=0,len(nums)
    while l<r:
        m=(l+r)//2
        if nums[m]<target:l=m+1
        else:r=m
    return l`,
    cpp: `int solution(vector<int> nums,int target){int l=0,r=(int)nums.size();while(l<r){int m=(l+r)/2;if(nums[m]<target)l=m+1;else r=m;}return l;}`,
    java: `class Solution{public int solution(int[] nums,int target){int l=0,r=nums.length;while(l<r){int m=(l+r)/2;if(nums[m]<target)l=m+1;else r=m;}return l;}}`,
  },

  // ── Find Minimum in Rotated Sorted Array ─────────────────────────────────────
  "Find Minimum in Rotated Sorted Array": {
    javascript: `function solution(nums){let l=0,r=nums.length-1;while(l<r){const m=(l+r)>>1;if(nums[m]>nums[r])l=m+1;else r=m;}return nums[l];}`,
    python: `
def solution(nums):
    l,r=0,len(nums)-1
    while l<r:
        m=(l+r)//2
        if nums[m]>nums[r]:l=m+1
        else:r=m
    return nums[l]`,
    cpp: `int solution(vector<int> nums){int l=0,r=(int)nums.size()-1;while(l<r){int m=(l+r)/2;if(nums[m]>nums[r])l=m+1;else r=m;}return nums[l];}`,
    java: `class Solution{public int solution(int[] nums){int l=0,r=nums.length-1;while(l<r){int m=(l+r)/2;if(nums[m]>nums[r])l=m+1;else r=m;}return nums[l];}}`,
  },

  // ── Kth Largest Element in an Array ─────────────────────────────────────────
  "Kth Largest Element in an Array": {
    javascript: `function solution(nums,k){nums.sort((a,b)=>b-a);return nums[k-1];}`,
    python: `def solution(nums,k):nums.sort(reverse=True);return nums[k-1]`,
    cpp: `int solution(vector<int> nums,int k){sort(nums.begin(),nums.end(),greater<int>());return nums[k-1];}`,
    java: `class Solution{public int solution(int[] nums,int k){java.util.Arrays.sort(nums);return nums[nums.length-k];}}`,
  },

  // ── Median of Two Sorted Arrays ──────────────────────────────────────────────
  "Median of Two Sorted Arrays": {
    javascript: `
function solution(nums1,nums2){
  const m=[...nums1,...nums2].sort((a,b)=>a-b),n=m.length;
  return n%2===1?m[Math.floor(n/2)]:Math.floor((m[n/2-1]+m[n/2])/2);
}`,
    python: `
def solution(nums1,nums2):
    m=sorted(nums1+nums2);n=len(m)
    return m[n//2] if n%2 else (m[n//2-1]+m[n//2])//2`,
    cpp: `
int solution(vector<int> nums1,vector<int> nums2){
    vector<int> m;
    for(int x:nums1)m.push_back(x);for(int x:nums2)m.push_back(x);
    sort(m.begin(),m.end());int n=m.size();
    if(n%2==1)return m[n/2];
    long long s=(long long)m[n/2-1]+m[n/2];
    return (int)(s>=0?s/2:(s-1)/2);
}`,
    java: `
class Solution{public int solution(int[] a,int[] b){
    int[] m=new int[a.length+b.length];
    System.arraycopy(a,0,m,0,a.length);System.arraycopy(b,0,m,a.length,b.length);
    java.util.Arrays.sort(m);int n=m.length;
    if(n%2==1)return m[n/2];
    long s=(long)m[n/2-1]+m[n/2];
    return (int)(s>=0?s/2:(s-1)/2);
}}`,
  },

  // ── Single Number ────────────────────────────────────────────────────────────
  "Single Number": {
    javascript: `function solution(nums){return nums.reduce((a,b)=>a^b,0);}`,
    python: `
def solution(nums):
    r=0
    for n in nums:r^=n
    return r`,
    cpp: `int solution(vector<int> nums){int r=0;for(int x:nums)r^=x;return r;}`,
    java: `class Solution{public int solution(int[] nums){int r=0;for(int x:nums)r^=x;return r;}}`,
  },

  // ── Reverse Bits ─────────────────────────────────────────────────────────────
  "Reverse Bits": {
    javascript: `
function solution(n){
  let r=0;
  for(let i=0;i<32;i++){r=r*2+(n&1);n=Math.floor(n/2);}
  return r>>>0;
}`,
    python: `
def solution(n):
    r=0
    for _ in range(32):r=(r<<1)|(n&1);n>>=1
    return r`,
    cpp: `
unsigned int solution(unsigned int n){
    unsigned int r=0;
    for(int i=0;i<32;i++){r=(r<<1)|(n&1);n>>=1;}
    return r;
}`,
    java: `class Solution{public long solution(long n){long r=0;for(int i=0;i<32;i++){r=(r<<1)|(n&1);n>>=1;}return r;}}`,
  },

  // ── Counting Bits ────────────────────────────────────────────────────────────
  "Counting Bits": {
    javascript: `
function solution(n){
  const r=[];
  for(let i=0;i<=n;i++){let x=i,c=0;while(x){c+=x&1;x>>=1;}r.push(c);}
  return r;
}`,
    python: `
def solution(n):
    return [bin(i).count('1') for i in range(n+1)]`,
    cpp: `
vector<int> solution(int n){
    vector<int> r(n+1);
    for(int i=1;i<=n;i++)r[i]=r[i>>1]+(i&1);
    return r;
}`,
    java: `
class Solution{public int[] solution(int n){int[] r=new int[n+1];for(int i=1;i<=n;i++)r[i]=r[i>>1]+(i&1);return r;}}`,
  },

  // ── Power of Two ─────────────────────────────────────────────────────────────
  "Power of Two": {
    javascript: `function solution(n){return n>0&&(n&(n-1))===0;}`,
    python: `def solution(n):return n>0 and (n&(n-1))==0`,
    // Use long to handle values > INT_MAX like 2147483648
    cpp: `bool solution(long long n){return n>0&&(n&(n-1))==0;}`,
    java: `class Solution{public boolean solution(long n){return n>0&&(n&(n-1))==0;}}`,
  },

  // ── Sum of Two Integers ──────────────────────────────────────────────────────
  "Sum of Two Integers": {
    javascript: `
function solution(a,b){while(b!==0){const c=(a&b)<<1;a=a^b;b=c;}return a;}`,
    python: `
def solution(a,b):
    mask=0xFFFFFFFF
    while b:
        a,b=(a^b)&mask,((a&b)<<1)&mask
    return a if a<0x80000000 else a-0x100000000`,
    cpp: `int solution(int a,int b){while(b){int c=(a&b)<<1;a^=b;b=c;}return a;}`,
    java: `class Solution{public int solution(int a,int b){while(b!=0){int c=(a&b)<<1;a^=b;b=c;}return a;}}`,
  },

  // ── Climbing Stairs ──────────────────────────────────────────────────────────
  "Climbing Stairs": {
    javascript: `function solution(n){let a=1,b=1;for(let i=2;i<=n;i++){const t=a+b;a=b;b=t;}return b;}`,
    python: `
def solution(n):
    a,b=1,1
    for _ in range(2,n+1):a,b=b,a+b
    return b`,
    cpp: `int solution(int n){int a=1,b=1;for(int i=2;i<=n;i++){int t=a+b;a=b;b=t;}return b;}`,
    java: `class Solution{public int solution(int n){int a=1,b=1;for(int i=2;i<=n;i++){int t=a+b;a=b;b=t;}return b;}}`,
  },

  // ── House Robber ─────────────────────────────────────────────────────────────
  "House Robber": {
    javascript: `
function solution(nums){let p2=0,p1=0;for(const n of nums){const c=Math.max(p1,p2+n);p2=p1;p1=c;}return p1;}`,
    python: `
def solution(nums):
    p2=p1=0
    for n in nums:p2,p1=p1,max(p1,p2+n)
    return p1`,
    cpp: `
int solution(vector<int> nums){int p2=0,p1=0;for(int n:nums){int c=max(p1,p2+n);p2=p1;p1=c;}return p1;}`,
    java: `
class Solution{public int solution(int[] nums){int p2=0,p1=0;for(int n:nums){int c=Math.max(p1,p2+n);p2=p1;p1=c;}return p1;}}`,
  },

  // ── Coin Change ──────────────────────────────────────────────────────────────
  "Coin Change": {
    javascript: `
function solution(coins,amount){
  const dp=Array(amount+1).fill(Infinity);dp[0]=0;
  for(const c of coins)for(let i=c;i<=amount;i++)dp[i]=Math.min(dp[i],dp[i-c]+1);
  return dp[amount]===Infinity?-1:dp[amount];
}`,
    python: `
def solution(coins,amount):
    dp=[float('inf')]*(amount+1);dp[0]=0
    for c in coins:
        for i in range(c,amount+1):dp[i]=min(dp[i],dp[i-c]+1)
    return -1 if dp[amount]==float('inf') else dp[amount]`,
    cpp: `
int solution(vector<int> coins,int amount){
    vector<int> dp(amount+1,INT_MAX);dp[0]=0;
    for(int c:coins)for(int i=c;i<=amount;i++)if(dp[i-c]!=INT_MAX)dp[i]=min(dp[i],dp[i-c]+1);
    return dp[amount]==INT_MAX?-1:dp[amount];
}`,
    java: `
class Solution{public int solution(int[] coins,int amount){
    int[] dp=new int[amount+1];java.util.Arrays.fill(dp,Integer.MAX_VALUE);dp[0]=0;
    for(int c:coins)for(int i=c;i<=amount;i++)if(dp[i-c]!=Integer.MAX_VALUE)dp[i]=Math.min(dp[i],dp[i-c]+1);
    return dp[amount]==Integer.MAX_VALUE?-1:dp[amount];
}}`,
  },

  // ── Longest Common Subsequence ───────────────────────────────────────────────
  "Longest Common Subsequence": {
    javascript: `
function solution(t1,t2){
  const m=t1.length,n=t2.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=t1[i-1]===t2[j-1]?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);
  return dp[m][n];
}`,
    python: `
def solution(t1,t2):
    m,n=len(t1),len(t2);dp=[[0]*(n+1) for _ in range(m+1)]
    for i in range(1,m+1):
        for j in range(1,n+1):dp[i][j]=dp[i-1][j-1]+1 if t1[i-1]==t2[j-1] else max(dp[i-1][j],dp[i][j-1])
    return dp[m][n]`,
    cpp: `
int solution(string t1,string t2){
    int m=t1.size(),n=t2.size();
    vector<vector<int>> dp(m+1,vector<int>(n+1,0));
    for(int i=1;i<=m;i++)for(int j=1;j<=n;j++)dp[i][j]=t1[i-1]==t2[j-1]?dp[i-1][j-1]+1:max(dp[i-1][j],dp[i][j-1]);
    return dp[m][n];
}`,
    java: `
class Solution{public int solution(String t1,String t2){
    int m=t1.length(),n=t2.length();int[][] dp=new int[m+1][n+1];
    for(int i=1;i<=m;i++)for(int j=1;j<=n;j++)dp[i][j]=t1.charAt(i-1)==t2.charAt(j-1)?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);
    return dp[m][n];
}}`,
  },

  // ── Edit Distance ────────────────────────────────────────────────────────────
  "Edit Distance": {
    javascript: `
function solution(w1,w2){
  const m=w1.length,n=w2.length,dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i+j));
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=w1[i-1]===w2[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}`,
    python: `
def solution(w1,w2):
    m,n=len(w1),len(w2);dp=[[i+j for j in range(n+1)] for i in range(m+1)]
    for i in range(1,m+1):
        for j in range(1,n+1):dp[i][j]=dp[i-1][j-1] if w1[i-1]==w2[j-1] else 1+min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1])
    return dp[m][n]`,
    cpp: `
int solution(string w1,string w2){
    int m=w1.size(),n=w2.size();
    vector<vector<int>> dp(m+1,vector<int>(n+1));
    for(int i=0;i<=m;i++)dp[i][0]=i;for(int j=0;j<=n;j++)dp[0][j]=j;
    for(int i=1;i<=m;i++)for(int j=1;j<=n;j++)dp[i][j]=w1[i-1]==w2[j-1]?dp[i-1][j-1]:1+min({dp[i-1][j],dp[i][j-1],dp[i-1][j-1]});
    return dp[m][n];
}`,
    java: `
class Solution{public int solution(String w1,String w2){
    int m=w1.length(),n=w2.length();int[][] dp=new int[m+1][n+1];
    for(int i=0;i<=m;i++)dp[i][0]=i;for(int j=0;j<=n;j++)dp[0][j]=j;
    for(int i=1;i<=m;i++)for(int j=1;j<=n;j++)dp[i][j]=w1.charAt(i-1)==w2.charAt(j-1)?dp[i-1][j-1]:1+Math.min(dp[i-1][j],Math.min(dp[i][j-1],dp[i-1][j-1]));
    return dp[m][n];
}}`,
  },

  // ── Reverse Linked List ──────────────────────────────────────────────────────
  "Reverse Linked List": {
    javascript: `function solution(nodes){return nodes.reverse();}`,
    python: `def solution(nodes):return nodes[::-1]`,
    cpp: `vector<int> solution(vector<int> nodes){reverse(nodes.begin(),nodes.end());return nodes;}`,
    java: `class Solution{public int[] solution(int[] nodes){int l=0,r=nodes.length-1;while(l<r){int t=nodes[l];nodes[l++]=nodes[r];nodes[r--]=t;}return nodes;}}`,
  },

  // ── Middle of the Linked List ────────────────────────────────────────────────
  "Middle of the Linked List": {
    javascript: `function solution(nodes){return nodes.slice(Math.floor(nodes.length/2));}`,
    python: `def solution(nodes):return nodes[len(nodes)//2:]`,
    cpp: `vector<int> solution(vector<int> nodes){return vector<int>(nodes.begin()+nodes.size()/2,nodes.end());}`,
    java: `class Solution{public int[] solution(int[] nodes){int mid=nodes.length/2;int[] r=new int[nodes.length-mid];System.arraycopy(nodes,mid,r,0,r.length);return r;}}`,
  },

  // ── Merge Two Sorted Lists ───────────────────────────────────────────────────
  "Merge Two Sorted Lists": {
    javascript: `
function solution(l1,l2){
  const r=[];let i=0,j=0;
  while(i<l1.length&&j<l2.length){if(l1[i]<=l2[j])r.push(l1[i++]);else r.push(l2[j++]);}
  while(i<l1.length)r.push(l1[i++]);while(j<l2.length)r.push(l2[j++]);return r;
}`,
    python: `
def solution(l1,l2):
    r=[];i=j=0
    while i<len(l1) and j<len(l2):
        if l1[i]<=l2[j]:r.append(l1[i]);i+=1
        else:r.append(l2[j]);j+=1
    return r+l1[i:]+l2[j:]`,
    cpp: `
vector<int> solution(vector<int> l1,vector<int> l2){
    vector<int> r;int i=0,j=0;
    while(i<(int)l1.size()&&j<(int)l2.size()){if(l1[i]<=l2[j])r.push_back(l1[i++]);else r.push_back(l2[j++]);}
    while(i<(int)l1.size())r.push_back(l1[i++]);while(j<(int)l2.size())r.push_back(l2[j++]);return r;
}`,
    java: `
class Solution{public int[] solution(int[] l1,int[] l2){
    int[] r=new int[l1.length+l2.length];int i=0,j=0,k=0;
    while(i<l1.length&&j<l2.length)r[k++]=l1[i]<=l2[j]?l1[i++]:l2[j++];
    while(i<l1.length)r[k++]=l1[i++];while(j<l2.length)r[k++]=l2[j++];return r;
}}`,
  },

  // ── Remove Nth Node From End of List ─────────────────────────────────────────
  "Remove Nth Node From End of List": {
    javascript: `
function solution(nodes,n){const idx=nodes.length-n;return[...nodes.slice(0,idx),...nodes.slice(idx+1)];}`,
    python: `
def solution(nodes,n):idx=len(nodes)-n;return nodes[:idx]+nodes[idx+1:]`,
    cpp: `
vector<int> solution(vector<int> nodes,int n){
    int idx=(int)nodes.size()-n;nodes.erase(nodes.begin()+idx);return nodes;
}`,
    java: `
class Solution{public int[] solution(int[] nodes,int n){
    int idx=nodes.length-n;int[] r=new int[nodes.length-1];
    System.arraycopy(nodes,0,r,0,idx);System.arraycopy(nodes,idx+1,r,idx,nodes.length-idx-1);return r;
}}`,
  },

  // ── Reorder List ─────────────────────────────────────────────────────────────
  "Reorder List": {
    javascript: `
function solution(nodes){
  const r=[];let l=0,ri=nodes.length-1,turn=true;
  while(l<=ri){if(turn)r.push(nodes[l++]);else r.push(nodes[ri--]);turn=!turn;}
  return r;
}`,
    python: `
def solution(nodes):
    r=[];l,ri,turn=0,len(nodes)-1,True
    while l<=ri:
        if turn:r.append(nodes[l]);l+=1
        else:r.append(nodes[ri]);ri-=1
        turn=not turn
    return r`,
    cpp: `
vector<int> solution(vector<int> nodes){
    vector<int> r;int l=0,ri=(int)nodes.size()-1;bool turn=true;
    while(l<=ri){if(turn)r.push_back(nodes[l++]);else r.push_back(nodes[ri--]);turn=!turn;}
    return r;
}`,
    java: `
class Solution{public int[] solution(int[] nodes){
    int[] r=new int[nodes.length];int l=0,ri=nodes.length-1,k=0;boolean turn=true;
    while(l<=ri){r[k++]=turn?nodes[l++]:nodes[ri--];turn=!turn;}return r;
}}`,
  },

  // ── Valid Parentheses ────────────────────────────────────────────────────────
  "Valid Parentheses": {
    javascript: `
function solution(s){
  const map={')':'(', '}':'{', ']':'['};const stack=[];
  for(const c of s){if('([{'.includes(c))stack.push(c);else if(stack.pop()!==map[c])return false;}
  return stack.length===0;
}`,
    python: `
def solution(s):
    m={')':'(','}':'{',']':'['};stack=[]
    for c in s:
        if c in '([{':stack.append(c)
        elif not stack or stack.pop()!=m[c]:return False
    return not stack`,
    cpp: `
bool solution(string s){
    unordered_map<char,char> m={{')','{'-1},{')','{'-1}};
    // simple stack approach
    stack<char> st;
    for(char c:s){
        if(c=='('||c=='['||c=='{')st.push(c);
        else{
            if(st.empty())return false;
            char t=st.top();st.pop();
            if((c==')'&&t!='(')||(c==']'&&t!='[')||(c=='}'&&t!='{'))return false;
        }
    }
    return st.empty();
}`,
    java: `
class Solution{public boolean solution(String s){
    java.util.Deque<Character> st=new java.util.ArrayDeque<>();
    for(char c:s.toCharArray()){
        if(c=='('||c=='['||c=='{')st.push(c);
        else{if(st.isEmpty())return false;char t=st.pop();if((c==')'&&t!='(')||(c==']'&&t!='[')||(c=='}'&&t!='{'))return false;}
    }
    return st.isEmpty();
}}`,
  },

  // ── Baseball Game ────────────────────────────────────────────────────────────
  "Baseball Game": {
    javascript: `
function solution(ops){
  const s=[];
  for(const op of ops){
    if(op==='+')s.push(s[s.length-1]+s[s.length-2]);
    else if(op==='D')s.push(s[s.length-1]*2);
    else if(op==='C')s.pop();
    else s.push(Number(op));
  }
  return s.reduce((a,b)=>a+b,0);
}`,
    python: `
def solution(ops):
    s=[]
    for op in ops:
        if op=='+':s.append(s[-1]+s[-2])
        elif op=='D':s.append(s[-1]*2)
        elif op=='C':s.pop()
        else:s.append(int(op))
    return sum(s)`,
    cpp: `
int solution(vector<string> ops){
    vector<int> s;
    for(auto& op:ops){
        if(op=="+")s.push_back(s[s.size()-1]+s[s.size()-2]);
        else if(op=="D")s.push_back(s.back()*2);
        else if(op=="C")s.pop_back();
        else s.push_back(stoi(op));
    }
    return accumulate(s.begin(),s.end(),0);
}`,
    // Use a List so we can index by position without Deque ordering confusion
    java: `
class Solution{public int solution(String[] ops){
    java.util.List<Integer> s=new java.util.ArrayList<>();
    for(String op:ops){
        int n=s.size();
        if(op.equals("+"))s.add(s.get(n-1)+s.get(n-2));
        else if(op.equals("D"))s.add(s.get(n-1)*2);
        else if(op.equals("C"))s.remove(n-1);
        else s.add(Integer.parseInt(op));
    }
    return s.stream().mapToInt(Integer::intValue).sum();
}}`,
  },

  // ── Evaluate Reverse Polish Notation ────────────────────────────────────────
  "Evaluate Reverse Polish Notation": {
    javascript: `
function solution(tokens){
  const s=[];
  for(const t of tokens){
    if('+-*/'.includes(t)){const b=s.pop(),a=s.pop();
      if(t==='+')s.push(a+b);else if(t==='-')s.push(a-b);else if(t==='*')s.push(a*b);else s.push(Math.trunc(a/b));}
    else s.push(Number(t));
  }
  return s[0];
}`,
    python: `
def solution(tokens):
    s=[]
    for t in tokens:
        if t in '+-*/':
            b,a=s.pop(),s.pop()
            if t=='+':s.append(a+b)
            elif t=='-':s.append(a-b)
            elif t=='*':s.append(a*b)
            else:s.append(int(a/b))
        else:s.append(int(t))
    return s[0]`,
    cpp: `
int solution(vector<string> tokens){
    stack<int> s;
    for(auto& t:tokens){
        if(t=="+"||t=="-"||t=="*"||t=="/"){int b=s.top();s.pop();int a=s.top();s.pop();
            if(t=="+")s.push(a+b);else if(t=="-")s.push(a-b);else if(t=="*")s.push(a*b);else s.push(a/b);}
        else s.push(stoi(t));
    }
    return s.top();
}`,
    java: `
class Solution{public int solution(String[] tokens){
    java.util.Deque<Integer> s=new java.util.ArrayDeque<>();
    for(String t:tokens){
        if(t.equals("+")||t.equals("-")||t.equals("*")||t.equals("/")){
            int b=s.pop(),a=s.pop();
            if(t.equals("+"))s.push(a+b);else if(t.equals("-"))s.push(a-b);else if(t.equals("*"))s.push(a*b);else s.push(a/b);}
        else s.push(Integer.parseInt(t));
    }
    return s.pop();
}}`,
  },

  // ── Daily Temperatures ───────────────────────────────────────────────────────
  "Daily Temperatures": {
    javascript: `
function solution(t){
  const r=Array(t.length).fill(0),s=[];
  for(let i=0;i<t.length;i++){while(s.length&&t[i]>t[s[s.length-1]]){const idx=s.pop();r[idx]=i-idx;}s.push(i);}
  return r;
}`,
    python: `
def solution(t):
    r=[0]*len(t);s=[]
    for i,v in enumerate(t):
        while s and v>t[s[-1]]:idx=s.pop();r[idx]=i-idx
        s.append(i)
    return r`,
    cpp: `
vector<int> solution(vector<int> t){
    vector<int> r(t.size(),0);stack<int> s;
    for(int i=0;i<(int)t.size();i++){while(!s.empty()&&t[i]>t[s.top()]){r[s.top()]=i-s.top();s.pop();}s.push(i);}
    return r;
}`,
    java: `
class Solution{public int[] solution(int[] t){
    int[] r=new int[t.length];java.util.Deque<Integer> s=new java.util.ArrayDeque<>();
    for(int i=0;i<t.length;i++){while(!s.isEmpty()&&t[i]>t[s.peek()]){int idx=s.pop();r[idx]=i-idx;}s.push(i);}
    return r;
}}`,
  },

  // ── Largest Rectangle in Histogram ──────────────────────────────────────────
  "Largest Rectangle in Histogram": {
    javascript: `
function solution(heights){
  const s=[-1];let max=0;
  for(let i=0;i<heights.length;i++){
    while(s[s.length-1]!==-1&&heights[s[s.length-1]]>=heights[i]){const h=heights[s.pop()];max=Math.max(max,h*(i-s[s.length-1]-1));}
    s.push(i);
  }
  while(s[s.length-1]!==-1){const h=heights[s.pop()];max=Math.max(max,h*(heights.length-s[s.length-1]-1));}
  return max;
}`,
    python: `
def solution(heights):
    s=[-1];mx=0
    for i,h in enumerate(heights):
        while s[-1]!=-1 and heights[s[-1]]>=h:ht=heights[s.pop()];mx=max(mx,ht*(i-s[-1]-1))
        s.append(i)
    while s[-1]!=-1:ht=heights[s.pop()];mx=max(mx,ht*(len(heights)-s[-1]-1))
    return mx`,
    cpp: `
int solution(vector<int> heights){
    stack<int> s;s.push(-1);int mx=0;
    for(int i=0;i<(int)heights.size();i++){
        while(s.top()!=-1&&heights[s.top()]>=heights[i]){int h=heights[s.top()];s.pop();mx=max(mx,h*(i-s.top()-1));}
        s.push(i);
    }
    while(s.top()!=-1){int h=heights[s.top()];s.pop();mx=max(mx,h*((int)heights.size()-s.top()-1));}
    return mx;
}`,
    java: `
class Solution{public int solution(int[] heights){
    java.util.Deque<Integer> s=new java.util.ArrayDeque<>();s.push(-1);int mx=0;
    for(int i=0;i<heights.length;i++){
        while(s.peek()!=-1&&heights[s.peek()]>=heights[i]){int h=heights[s.pop()];mx=Math.max(mx,h*(i-s.peek()-1));}
        s.push(i);
    }
    while(s.peek()!=-1){int h=heights[s.pop()];mx=Math.max(mx,h*(heights.length-s.peek()-1));}
    return mx;
}}`,
  },

  // ── Maximum Depth of Binary Tree ─────────────────────────────────────────────
  "Maximum Depth of Binary Tree": {
    javascript: `
function solution(nodes){
  if(!nodes||nodes.length===0||nodes[0]===-1)return 0;
  function depth(i){
    if(i>=nodes.length||nodes[i]===-1||nodes[i]===null)return 0;
    return 1+Math.max(depth(2*i+1),depth(2*i+2));
  }
  return depth(0);
}`,
    python: `
def solution(nodes):
    if not nodes or nodes[0]==-1:return 0
    def depth(i):
        if i>=len(nodes) or nodes[i]==-1:return 0
        return 1+max(depth(2*i+1),depth(2*i+2))
    return depth(0)`,
    cpp: `
int solution(vector<int> nodes){
    if(nodes.empty()||nodes[0]==-1)return 0;
    function<int(int)> depth=[&](int i)->int{
        if(i>=(int)nodes.size()||nodes[i]==-1)return 0;
        return 1+max(depth(2*i+1),depth(2*i+2));
    };
    return depth(0);
}`,
    java: `
class Solution{public int solution(int[] nodes){
    if(nodes.length==0||nodes[0]==-1)return 0;
    return depth(nodes,0);
}
int depth(int[] n,int i){
    if(i>=n.length||n[i]==-1)return 0;
    return 1+Math.max(depth(n,2*i+1),depth(n,2*i+2));
}}`,
  },

  // ── Invert Binary Tree ───────────────────────────────────────────────────────
  "Invert Binary Tree": {
    // JS reference solution already verified in problems.test.js
    javascript: `
function solution(nodes){
  if(!nodes||nodes.length===0)return[];
  if(nodes[0]===-1||nodes[0]===null)return[];
  const root={val:nodes[0],left:null,right:null};
  const queue=[root];let i=1;
  while(queue.length&&i<nodes.length){
    const node=queue.shift();
    if(i<nodes.length){if(nodes[i]!==-1&&nodes[i]!==null){node.left={val:nodes[i],left:null,right:null};queue.push(node.left);}i++;}
    if(i<nodes.length){if(nodes[i]!==-1&&nodes[i]!==null){node.right={val:nodes[i],left:null,right:null};queue.push(node.right);}i++;}
  }
  function inv(n){if(!n)return;[n.left,n.right]=[n.right,n.left];inv(n.left);inv(n.right);}
  inv(root);
  const result=[];let level=[root];
  while(level.length){
    const next=[];let hasReal=false;
    for(const n of level){if(n){result.push(n.val);next.push(n.left,n.right);hasReal=true;}else result.push(-1);}
    if(!hasReal){for(let k=0;k<level.length;k++)result.pop();break;}
    if(!next.some(n=>n!==null&&n!==undefined))break;
    level=next;
  }
  return result;
}`,
    python: `
def solution(nodes):
    if not nodes or nodes[0]==-1:return []
    from collections import deque
    root={'val':nodes[0],'left':None,'right':None}
    q=deque([root]);i=1
    while q and i<len(nodes):
        n=q.popleft()
        if i<len(nodes):
            if nodes[i]!=-1:n['left']={'val':nodes[i],'left':None,'right':None};q.append(n['left'])
            i+=1
        if i<len(nodes):
            if nodes[i]!=-1:n['right']={'val':nodes[i],'left':None,'right':None};q.append(n['right'])
            i+=1
    def inv(n):
        if not n:return
        n['left'],n['right']=n['right'],n['left'];inv(n['left']);inv(n['right'])
    inv(root)
    result=[];level=[root]
    while level:
        nxt=[];has=False
        for n in level:
            if n:result.append(n['val']);nxt.extend([n['left'],n['right']]);has=True
            else:result.append(-1)
        if not has:
            for _ in level:result.pop()
            break
        if not any(n for n in nxt):break
        level=nxt
    return result`,
    cpp: `
struct Node{int val;Node*left=nullptr,*right=nullptr;Node(int v):val(v){}};
vector<int> solution(vector<int> nodes){
    if(nodes.empty()||nodes[0]==-1)return{};
    Node* root=new Node(nodes[0]);
    queue<Node*> q;q.push(root);int i=1;
    while(!q.empty()&&i<(int)nodes.size()){
        Node* n=q.front();q.pop();
        if(i<(int)nodes.size()){if(nodes[i]!=-1){n->left=new Node(nodes[i]);q.push(n->left);}i++;}
        if(i<(int)nodes.size()){if(nodes[i]!=-1){n->right=new Node(nodes[i]);q.push(n->right);}i++;}
    }
    function<void(Node*)> inv=[&](Node* n){
        if(!n)return;swap(n->left,n->right);inv(n->left);inv(n->right);
    };
    inv(root);
    vector<int> result;
    vector<Node*> level={root};
    while(!level.empty()){
        vector<Node*> nxt;bool has=false;
        for(Node* n:level){
            if(n){result.push_back(n->val);nxt.push_back(n->left);nxt.push_back(n->right);has=true;}
            else result.push_back(-1);
        }
        if(!has){for(size_t k=0;k<level.size();k++)result.pop_back();break;}
        bool anyReal=false;for(Node* n:nxt)if(n)anyReal=true;
        if(!anyReal)break;
        level=nxt;
    }
    return result;
}`,
    java: `
class Solution{
    static class Node{int val;Node left,right;Node(int v){val=v;}}
    public int[] solution(int[] nodes){
        if(nodes.length==0||nodes[0]==-1)return new int[]{};
        Node root=new Node(nodes[0]);
        java.util.Queue<Node> q=new java.util.LinkedList<>();q.add(root);int i=1;
        while(!q.isEmpty()&&i<nodes.length){
            Node n=q.poll();
            if(i<nodes.length){if(nodes[i]!=-1){n.left=new Node(nodes[i]);q.add(n.left);}i++;}
            if(i<nodes.length){if(nodes[i]!=-1){n.right=new Node(nodes[i]);q.add(n.right);}i++;}
        }
        inv(root);
        java.util.List<Integer> result=new java.util.ArrayList<>();
        java.util.List<Node> level=new java.util.ArrayList<>();level.add(root);
        while(!level.isEmpty()){
            java.util.List<Node> nxt=new java.util.ArrayList<>();boolean has=false;
            for(Node n:level){if(n!=null){result.add(n.val);nxt.add(n.left);nxt.add(n.right);has=true;}else result.add(-1);}
            if(!has){for(int k=0;k<level.size();k++)result.remove(result.size()-1);break;}
            boolean any=false;for(Node n:nxt)if(n!=null)any=true;
            if(!any)break;level=nxt;
        }
        return result.stream().mapToInt(Integer::intValue).toArray();
    }
    void inv(Node n){if(n==null)return;Node t=n.left;n.left=n.right;n.right=t;inv(n.left);inv(n.right);}
}`,
  },

  // ── Number of Islands ────────────────────────────────────────────────────────
  "Number of Islands": {
    javascript: `
function solution(grid){
  let count=0;const R=grid.length,C=grid[0].length;
  function dfs(r,c){if(r<0||r>=R||c<0||c>=C||grid[r][c]!==1)return;grid[r][c]=0;dfs(r+1,c);dfs(r-1,c);dfs(r,c+1);dfs(r,c-1);}
  for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(grid[r][c]===1){dfs(r,c);count++;}
  return count;
}`,
    python: `
def solution(grid):
    R,C=len(grid),len(grid[0]);count=0
    def dfs(r,c):
        if r<0 or r>=R or c<0 or c>=C or grid[r][c]!=1:return
        grid[r][c]=0;dfs(r+1,c);dfs(r-1,c);dfs(r,c+1);dfs(r,c-1)
    for r in range(R):
        for c in range(C):
            if grid[r][c]==1:dfs(r,c);count+=1
    return count`,
    cpp: `
int solution(vector<vector<int>> grid){
    int R=grid.size(),C=grid[0].size(),count=0;
    function<void(int,int)> dfs=[&](int r,int c){
        if(r<0||r>=R||c<0||c>=C||grid[r][c]!=1)return;
        grid[r][c]=0;dfs(r+1,c);dfs(r-1,c);dfs(r,c+1);dfs(r,c-1);
    };
    for(int r=0;r<R;r++)for(int c=0;c<C;c++)if(grid[r][c]==1){dfs(r,c);count++;}
    return count;
}`,
    java: `
class Solution{
    int R,C;int[][] grid;
    public int solution(int[][] g){
        R=g.length;C=g[0].length;grid=g;int count=0;
        for(int r=0;r<R;r++)for(int c=0;c<C;c++)if(grid[r][c]==1){dfs(r,c);count++;}
        return count;
    }
    void dfs(int r,int c){if(r<0||r>=R||c<0||c>=C||grid[r][c]!=1)return;grid[r][c]=0;dfs(r+1,c);dfs(r-1,c);dfs(r,c+1);dfs(r,c-1);}
}`,
  },

  // ── Binary Tree Level Order Traversal ────────────────────────────────────────
  "Binary Tree Level Order Traversal": {
    javascript: `
function solution(nodes){
  if(!nodes||nodes.length===0||nodes[0]===-1)return[];
  const result=[];let levelStart=0,levelSize=1;
  while(levelStart<nodes.length){
    const level=[];
    for(let i=levelStart;i<levelStart+levelSize&&i<nodes.length;i++)
      if(nodes[i]!==-1&&nodes[i]!==null)level.push(nodes[i]);
    if(level.length>0)result.push(level);
    levelStart+=levelSize;levelSize*=2;
  }
  return result;
}`,
    python: `
def solution(nodes):
    if not nodes or nodes[0]==-1:return []
    result=[];start=0;size=1
    while start<len(nodes):
        level=[nodes[i] for i in range(start,min(start+size,len(nodes))) if nodes[i]!=-1]
        if level:result.append(level)
        start+=size;size*=2
    return result`,
    cpp: `
vector<vector<int>> solution(vector<int> nodes){
    if(nodes.empty()||nodes[0]==-1)return{};
    vector<vector<int>> result;int start=0,size=1;
    while(start<(int)nodes.size()){
        vector<int> level;
        for(int i=start;i<start+size&&i<(int)nodes.size();i++)
            if(nodes[i]!=-1)level.push_back(nodes[i]);
        if(!level.empty())result.push_back(level);
        start+=size;size*=2;
    }
    return result;
}`,
    java: `
class Solution{public int[][] solution(int[] nodes){
    if(nodes.length==0||nodes[0]==-1)return new int[][]{};
    java.util.List<int[]> result=new java.util.ArrayList<>();int start=0,size=1;
    while(start<nodes.length){
        java.util.List<Integer> level=new java.util.ArrayList<>();
        for(int i=start;i<start+size&&i<nodes.length;i++)if(nodes[i]!=-1)level.add(nodes[i]);
        if(!level.isEmpty())result.add(level.stream().mapToInt(Integer::intValue).toArray());
        start+=size;size*=2;
    }
    return result.toArray(new int[0][]);
}}`,
  },

  // ── Course Schedule ──────────────────────────────────────────────────────────
  "Course Schedule": {
    javascript: `
function solution(numCourses,prereqs){
  const adj=Array.from({length:numCourses},()=>[]);
  for(const [a,b] of prereqs)adj[b].push(a);
  const v=Array(numCourses).fill(0);
  function dfs(n){if(v[n]===1)return true;if(v[n]===2)return false;v[n]=1;for(const nb of adj[n])if(dfs(nb))return true;v[n]=2;return false;}
  for(let i=0;i<numCourses;i++)if(dfs(i))return false;
  return true;
}`,
    python: `
def solution(numCourses,prereqs):
    adj=[[] for _ in range(numCourses)]
    for a,b in prereqs:adj[b].append(a)
    v=[0]*numCourses
    def dfs(n):
        if v[n]==1:return True
        if v[n]==2:return False
        v[n]=1
        for nb in adj[n]:
            if dfs(nb):return True
        v[n]=2;return False
    for i in range(numCourses):
        if dfs(i):return False
    return True`,
    cpp: `
bool solution(int numCourses,vector<vector<int>> prereqs){
    vector<vector<int>> adj(numCourses);
    for(auto& e:prereqs)adj[e[1]].push_back(e[0]);
    vector<int> v(numCourses,0);
    function<bool(int)> dfs=[&](int n)->bool{
        if(v[n]==1)return true;if(v[n]==2)return false;
        v[n]=1;for(int nb:adj[n])if(dfs(nb))return true;v[n]=2;return false;
    };
    for(int i=0;i<numCourses;i++)if(dfs(i))return false;
    return true;
}`,
    java: `
class Solution{public boolean solution(int numCourses,int[][] prereqs){
    java.util.List<java.util.List<Integer>> adj=new java.util.ArrayList<>();
    for(int i=0;i<numCourses;i++)adj.add(new java.util.ArrayList<>());
    for(int[] e:prereqs)adj.get(e[1]).add(e[0]);
    int[] v=new int[numCourses];
    for(int i=0;i<numCourses;i++)if(dfs(adj,v,i))return false;
    return true;
}
boolean dfs(java.util.List<java.util.List<Integer>> adj,int[] v,int n){
    if(v[n]==1)return true;if(v[n]==2)return false;
    v[n]=1;for(int nb:adj.get(n))if(dfs(adj,v,nb))return true;v[n]=2;return false;
}}`,
  },
};

// ─── test runner ──────────────────────────────────────────────────────────────

async function runAll(filterLangs, filterTitle, filterCategory) {
  const files = walkJsonFiles(BANK_DIR);
  const langs = filterLangs.length > 0 ? filterLangs : LANGS;

  let passed = 0, failed = 0, skipped = 0;
  const failures = [];

  for (const file of files) {
    const category = path.basename(path.dirname(file));
    const q = JSON.parse(fs.readFileSync(file, "utf8"));
    const title = q.title;

    if (filterTitle && !title.toLowerCase().includes(filterTitle.toLowerCase())) {
      skipped += langs.length; continue;
    }
    if (filterCategory && category !== filterCategory) {
      skipped += langs.length; continue;
    }

    const solutions = SOLUTIONS[title];
    if (!solutions) {
      console.log(`  SKIP  [no solutions] ${title}`);
      skipped += langs.length; continue;
    }

    const question = buildQuestion(q);

    for (const lang of langs) {
      const code = solutions[lang];
      if (!code) {
        console.log(`  SKIP  [${lang.padEnd(10)}] ${title} — no solution`);
        skipped++; continue;
      }

      let result;
      try {
        result = await executeCode(code, lang, question);
      } catch (err) {
        console.log(`  ERROR [${lang.padEnd(10)}] [${category}] ${title}: ${err.message}`);
        failures.push({ title, category, lang, reason: err.message });
        failed++; continue;
      }

      const label = `[${lang.padEnd(10)}] [${category.padEnd(28)}] ${title.padEnd(42)}`;
      if (result.allTestsPassed) {
        console.log(`  PASS  ${label} ${result.ratio}`);
        passed++;
      } else {
        const msg = (result.failedMessage || "unknown").slice(0, 150);
        console.log(`  FAIL  ${label} ${result.ratio || "?/?"}  — ${msg}`);
        failures.push({ title, category, lang, reason: msg, ratio: result.ratio });
        failed++;
      }
    }
  }

  console.log("\n" + "─".repeat(90));
  console.log(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped  (${passed + failed + skipped} total)`);

  if (failures.length > 0) {
    console.log("\nFailed:");
    for (const f of failures) {
      console.log(`  • [${f.lang}] [${f.category}] ${f.title}${f.ratio ? " (" + f.ratio + ")" : ""}`);
      console.log(`      ${f.reason}`);
    }
    process.exitCode = 1;
  }
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let filterLangs = [], filterTitle, filterCategory;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--lang" && args[i + 1]) filterLangs = args[++i].split(",");
  if (args[i] === "--filter" && args[i + 1]) filterTitle = args[++i];
  if (args[i] === "--category" && args[i + 1]) filterCategory = args[++i];
}

console.log("Running multi-language problem judge tests...\n");
runAll(filterLangs, filterTitle, filterCategory).catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
