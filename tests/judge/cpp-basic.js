const { executeCode } = require('./server/services/judgeService');
const cppCode = `
#include <vector>
using namespace std;
vector<vector<int>> solution(vector<int> nums) {
    return {{-1, 0, 1}, {-1, -1, 2}};
}
`;
const q = { 
    args: ['integer[]'],
    sampleTests: [ 
        { input: '[-1,0,1,2,-1,-4]', expected: '[[-1,-1,2],[-1,0,1]]', orderIndependent: true }
    ] 
};
executeCode(cppCode, 'cpp', q).then(res => console.log(res.failedMessage));
