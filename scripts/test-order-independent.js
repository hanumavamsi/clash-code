const { executeCode } = require('../server/services/judgeService');

const jsCode = `
function solution(nums) {
    // 3Sum wrong order intentionally
    return [[-1, 0, 1], [-1, -1, 2]];
}
`;

const pyCode = `
def solution(nums):
    return [[-1, 0, 1], [-1, -1, 2]]
`;

const cppCode = `
#include <vector>
using namespace std;
vector<vector<int>> solution(vector<int> nums) {
    return {{-1, 0, 1}, {-1, -1, 2}};
}
`;

const javaCode = `
class Solution {
    public int[][] solution(int[] nums) {
        return new int[][]{ {-1, 0, 1}, {-1, -1, 2} };
    }
}
`;

const q = { 
    args: ["integer[]"],
    sampleTests: [ 
        { input: "[-1,0,1,2,-1,-4]", expected: "[[-1,-1,2],[-1,0,1]]", orderIndependent: true }
    ] 
};

async function test() {
    console.log("Testing JS:");
    console.log(await executeCode(jsCode, 'javascript', q));
    console.log("Testing Python:");
    console.log(await executeCode(pyCode, 'python', q));
    console.log("Testing C++:");
    console.log(await executeCode(cppCode, 'cpp', q));
    console.log("Testing Java:");
    console.log(await executeCode(javaCode, 'java', q));
}

test();
