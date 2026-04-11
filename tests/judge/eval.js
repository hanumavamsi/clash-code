const code = "function solution(arr) { return arr.reduce((a,b)=>a+b,0); }";
const tc = { input: "[1,2,3]" };
const runnerCode = `${code}\nconst result = solution(${tc.input});\nconsole.log(JSON.stringify(result));`;
console.log("Runner code:", runnerCode);
eval(runnerCode);
