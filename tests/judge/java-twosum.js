const { executeCode } = require('./server/services/judgeService');

const javaCode = `
import java.util.*;
class Solution {
    public int[] solution(int[] nums, int target) {
        return new int[]{0, 1};
    }
}
`;

const q = { args: ["integer[]", "integer"], sampleTests: [ { input: '[[2,7,11,15], 9]', expected: '[0, 1]', is_single_array_arg: false } ] };

executeCode(javaCode, 'java', q).then(console.log);
