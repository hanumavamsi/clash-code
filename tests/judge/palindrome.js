const { executeCode } = require('./server/services/judgeService');
const testQuestion = {
    sampleTests: [
        { input: '"racecar"', expected: "true" },
        { input: '"hello"', expected: "false" }
    ]
};
const code = `
#include <string>
#include <iostream>
using namespace std;
string solution(string s) {
    string res = "";
    for (int i = 0; i < s.size(); i++) {
        for (int j = 0; j < 2; j++) {
            int l = i, r = i + j;
            while (l >= 0 && r < s.size() && s[l] == s[r]) l--, r++;
            if (r - l - 1 > res.size())
                res = s.substr(l + 1, r - l - 1);
        }
    }
    return res;
}
`;
executeCode(code, 'cpp', testQuestion).then(console.log).catch(console.error);
