const { executeCode } = require('../../server/services/judgeService');

const mockTests = [
    { input: JSON.stringify([1, 2, 3]), expected: JSON.stringify(6), is_single_array_arg: true }, // Sum Array
    { input: JSON.stringify([[1,2], [3,4]]), expected: JSON.stringify([1,2,3,4]), is_single_array_arg: true }, // Flatten
    { input: JSON.stringify(["hello", "world"]), expected: JSON.stringify("helloworld"), is_single_array_arg: false }, // Concat strings
    { input: JSON.stringify(true), expected: JSON.stringify(false), is_single_array_arg: true } // Invert bool
];

const jsCode = `
function solution(a, b) {
    if (typeof a === 'boolean') return !a;
    if (typeof a === 'string') return a + b;
    if (Array.isArray(a) && Array.isArray(a[0])) return a.flat();
    if (Array.isArray(a)) return a.reduce((sum, n) => sum + n, 0);
    return null;
}
`;

const pyCode = `
def solution(*args):
    if len(args) == 2 and isinstance(args[0], str):
        return args[0] + args[1]
    a = args[0]
    if isinstance(a, bool):
        return not a
    if isinstance(a, list):
        if len(a) > 0 and isinstance(a[0], list):
            return [x for sub in a for x in sub]
        return sum(a)
    return None
`;

const javaCode = `
import java.util.*;
class Solution {
    public int solution(int[] a) {
        return Arrays.stream(a).sum();
    }
    public int[] solution(int[][] a) {
        return Arrays.stream(a).flatMapToInt(Arrays::stream).toArray();
    }
    public String solution(String a, String b) {
        return a + b;
    }
    public boolean solution(boolean a) {
        return !a;
    }
}
`;

const cppCode = `
#include <vector>
#include <numeric>
#include <string>
using namespace std;

// Overloads for different types
int solution(vector<int> a) {
    int sum = 0; for(int x : a) sum += x; return sum;
}
vector<int> solution(vector<vector<int>> a) {
    vector<int> res;
    for (auto& row : a) for(int x : row) res.push_back(x);
    return res;
}
string solution(string a, string b) {
    return a + b;
}
bool solution(bool a) {
    return !a;
}
`;

async function runLang(lang, code) {
    console.log("------------------------");
    console.log("Testing:", lang);
    for (let i = 0; i < mockTests.length; i++) {
        const q = { sampleTests: [mockTests[i]] };
        console.log("  Test case", i+1, "input:", mockTests[i].input);
        const res = await executeCode(code, lang, q);
        console.log("  Result:", res);
    }
}

async function main() {
    await runLang("javascript", jsCode);
    await runLang("python", pyCode);
    // await runLang("java", javaCode); // requires Java setup matching Docker perfectly
    // await runLang("cpp", cppCode);
}
main();
