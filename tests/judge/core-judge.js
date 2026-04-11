const { executeCode } = require('./server/services/judgeService');

async function test(label, code, lang, q) {
    const r = await executeCode(code, lang, q);
    const ok = r.allTestsPassed ? 'PASS' : 'FAIL';
    const msg = r.failedMessage ? '| ' + r.failedMessage.slice(0, 120) : '';
    console.log(`${ok}  [${lang.padEnd(10)}] ${label.padEnd(25)} ${r.ratio || '?/?'} ${msg}`);
}

async function runAll() {
    const qSum = {
        title: 'Sum', difficulty: 'easy',
        sampleTests: [
            { input: '[1,2,3]', expected: '6' },
            { input: '[-1,0,1]', expected: '0' },
            { input: '[]', expected: '0' },
        ]
    };

    const qStr = {
        title: 'Reverse string', difficulty: 'easy',
        sampleTests: [
            { input: '"hello"', expected: '"olleh"' },
            { input: '"ab"', expected: '"ba"' },
        ]
    };

    const qScalar = {
        title: 'Double int', difficulty: 'easy',
        sampleTests: [
            { input: '5', expected: '10' },
            { input: '0', expected: '0' },
        ]
    };

    const qWrong = {
        title: 'Wrong answer', difficulty: 'easy',
        sampleTests: [{ input: '[1,2]', expected: '999' }]
    };

    const qTLE = {
        title: 'TLE', difficulty: 'easy',
        sampleTests: [{ input: '1', expected: '1' }]
    };

    console.log('\n=== CORRECT SOLUTIONS ===');
    await test('sum array', 'function solution(a){return a.reduce((s,x)=>s+x,0);}', 'javascript', qSum);
    await test('sum array', 'def solution(a):\n    return sum(a) if a else 0', 'python', qSum);
    await test('sum array', '#include<numeric>\nint solution(std::vector<int> a){return !a.empty()?std::accumulate(a.begin(),a.end(),0):0;}', 'cpp', qSum);
    await test('sum array', 'class Solution{public int solution(int[] a){int s=0;for(int x:a)s+=x;return s;}}', 'java', qSum);

    await test('double scalar', 'function solution(n){return n*2;}', 'javascript', qScalar);
    await test('double scalar', 'def solution(n):\n    return n*2', 'python', qScalar);
    await test('double scalar', 'int solution(int n){return n*2;}', 'cpp', qScalar);
    await test('double scalar', 'class Solution{public int solution(int n){return n*2;}}', 'java', qScalar);

    await test('reverse string', 'function solution(s){return s.split("").reverse().join("");}', 'javascript', qStr);
    await test('reverse string', 'def solution(s):\n    return s[::-1]', 'python', qStr);
    await test('reverse string', '#include<algorithm>\nstd::string solution(std::string s){std::reverse(s.begin(),s.end());return s;}', 'cpp', qStr);
    await test('reverse string', 'class Solution{public String solution(String s){return new StringBuilder(s).reverse().toString();}}', 'java', qStr);

    console.log('\n=== WRONG ANSWER DETECTION ===');
    await test('returns wrong', 'function solution(a){return 42;}', 'javascript', qWrong);
    await test('returns wrong', 'int solution(std::vector<int> a){return 42;}', 'cpp', qWrong);
    await test('returns wrong', 'class Solution{public int solution(int[] a){return 42;}}', 'java', qWrong);

    console.log('\n=== TLE DETECTION ===');
    await test('infinite loop', "function solution(x){let i=0;while(true){i++;} return i;}", 'javascript', qTLE);

    console.log('\n=== COMPILE ERROR DETECTION ===');
    await test('syntax error', 'int solution(std::vector<int> a){ BROKEN }', 'cpp', {
        title: 'x', difficulty: 'easy', sampleTests: [{ input: '[1]', expected: '1' }]
    });
    await test('syntax error', 'class Solution{public int solution(int[] a){BROKEN}}', 'java', {
        title: 'x', difficulty: 'easy', sampleTests: [{ input: '[1]', expected: '1' }]
    });

    console.log('\nDone.');
}

runAll().catch(console.error);
