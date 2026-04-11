const { executeCode } = require('./server/services/judgeService');

// Common C++ Two Sum patterns users might write
const codes = {
    "value params": `
#include <vector>
#include <unordered_map>
using namespace std;
vector<int> solution(vector<int> nums, int target) {
    unordered_map<int,int> mp;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (mp.count(complement)) return {mp[complement], i};
        mp[nums[i]] = i;
    }
    return {};
}
`,
    "const-ref params": `
#include <vector>
#include <unordered_map>
using namespace std;
vector<int> solution(const vector<int>& nums, int target) {
    unordered_map<int,int> mp;
    for (int i = 0; i < (int)nums.size(); i++) {
        int c = target - nums[i];
        if (mp.count(c)) return {mp[c], i};
        mp[nums[i]] = i;
    }
    return {};
}
`,
    "lvalue-ref params (the bug case)": `
#include <vector>
#include <unordered_map>
using namespace std;
vector<int>& solution(vector<int>& nums, int target) {
    static vector<int> res;
    res.clear();
    unordered_map<int,int> mp;
    for (int i = 0; i < (int)nums.size(); i++) {
        int c = target - nums[i];
        if (mp.count(c)) { res = {mp[c], i}; return res; }
        mp[nums[i]] = i;
    }
    return res;
}
`
};

const q = {
    args: ["integer[]", "integer"],
    sampleTests: [
        { input: "[[2,7,11,15], 9]", expected: "[0,1]", is_single_array_arg: false, orderIndependent: true },
        { input: "[[3,2,4], 6]",     expected: "[1,2]", is_single_array_arg: false, orderIndependent: true }
    ]
};

(async () => {
    for (const [label, code] of Object.entries(codes)) {
        const res = await executeCode(code, 'cpp', q);
        console.log(`[${label}]`, res.allTestsPassed ? "PASS" : "FAIL", res.failedMessage ? res.failedMessage.slice(0,200) : "");
    }
})();
