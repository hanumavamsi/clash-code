const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { exec } = require("child_process");

// ──────────────────────────────────────────────────────────────────────────────
// Literal / type generators (C++ and Java)
// ──────────────────────────────────────────────────────────────────────────────

function escapeString(str) {
    return str
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
}

function cppLiteral(val) {
    if (val === null || val === undefined) return "0";
    if (typeof val === "boolean") return val ? "true" : "false";
    if (typeof val === "number") return Number.isInteger(val) ? String(val) : val.toFixed(10);
    if (typeof val === "string") return `"${escapeString(val)}"`;
    if (Array.isArray(val)) {
        if (val.length === 0) return "{}";
        const inner = val.map(cppLiteral).join(", ");
        if (Array.isArray(val[0])) return `{${inner}}`;
        if (typeof val[0] === "string") return `{"${val.map(escapeString).join('", "')}"}`;
        return `{${inner}}`;
    }
    return String(val);
}

function cppType(val) {
    if (typeof val === "boolean") return "bool";
    if (typeof val === "number") return Number.isInteger(val) ? "int" : "double";
    if (typeof val === "string") return "std::string";
    if (Array.isArray(val)) {
        if (val.length === 0) return "std::vector<int>";
        const s = val[0];
        if (Array.isArray(s)) {
            if (s.length > 0 && typeof s[0] === "string") return "std::vector<std::vector<std::string>>";
            return "std::vector<std::vector<int>>";
        }
        if (typeof s === "string") return "std::vector<std::string>";
        if (typeof s === "boolean") return "std::vector<bool>";
        return "std::vector<int>";
    }
    return "auto";
}

function javaLiteral(val) {
    if (val === null || val === undefined) return "null";
    if (typeof val === "boolean") return val ? "true" : "false";
    if (typeof val === "number") return Number.isInteger(val) ? String(val) : val.toFixed(10);
    if (typeof val === "string") return `"${escapeString(val)}"`;
    if (Array.isArray(val)) {
        if (val.length === 0) return "new int[]{}";
        const s = val[0];
        if (Array.isArray(s)) {
            const inner = val.map(javaLiteral).join(", ");
            if (s.length > 0 && typeof s[0] === "string") return `new String[][]{${inner}}`;
            return `new int[][]{${inner}}`;
        }
        if (typeof s === "string") return `new String[]{"${val.map(escapeString).join('", "')}"}`;
        if (typeof s === "boolean") return `new boolean[]{${val.join(", ")}}`;
        return `new int[]{${val.join(", ")}}`;
    }
    return String(val);
}

function javaEquality(actualExpr, expected) {
    if (Array.isArray(expected)) {
        if (expected.length > 0 && Array.isArray(expected[0])) {
            return `Arrays.deepEquals(${actualExpr}, ${javaLiteral(expected)})`;
        }
        return `Arrays.equals(${actualExpr}, ${javaLiteral(expected)})`;
    }
    if (typeof expected === "string") return `${javaLiteral(expected)}.equals(${actualExpr})`;
    if (typeof expected === "number" && !Number.isInteger(expected)) {
        return `Math.abs(${actualExpr} - ${javaLiteral(expected)}) < 1e-9`;
    }
    return `${actualExpr} == ${javaLiteral(expected)}`;
}

function cppEquality(actualExpr, expected) {
    if (typeof expected === "number" && !Number.isInteger(expected)) {
        return `std::abs(${actualExpr} - ${cppLiteral(expected)}) < 1e-9`;
    }
    const lit = cppLiteral(expected);
    if (Array.isArray(expected)) return `${actualExpr} == ${cppType(expected)}${lit}`;
    return `${actualExpr} == ${lit}`;
}

/**
 * Generates a C++ inline code block that sorts actual + expected before comparing.
 * Returns the lines to inject into the test block (sets bool ok).
 */
function cppOrderIndependentBlock(actualVar, expected) {
    const typ = cppType(expected);
    const lit = cppLiteral(expected);
    const isNested = Array.isArray(expected) && expected.length > 0 && Array.isArray(expected[0]);
    if (isNested) {
        return `for (auto& _r : ${actualVar}) std::sort(_r.begin(), _r.end());
        std::sort(${actualVar}.begin(), ${actualVar}.end());
        ${typ} _exp${actualVar} = ${typ}${lit};
        for (auto& _r : _exp${actualVar}) std::sort(_r.begin(), _r.end());
        std::sort(_exp${actualVar}.begin(), _exp${actualVar}.end());
        bool ok = (${actualVar} == _exp${actualVar});`;
    }
    if (Array.isArray(expected)) {
        return `std::sort(${actualVar}.begin(), ${actualVar}.end());
        ${typ} _exp${actualVar} = ${typ}${lit};
        std::sort(_exp${actualVar}.begin(), _exp${actualVar}.end());
        bool ok = (${actualVar} == _exp${actualVar});`;
    }
    return `bool ok = (${cppEquality(actualVar, expected)});`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main judge function
// ──────────────────────────────────────────────────────────────────────────────

async function executeCode(code, language, question) {
    const testFilenameId = crypto.randomUUID();
    const tempDir = path.join(process.cwd(), ".tempcode", testFilenameId);
    fs.mkdirSync(tempDir, { recursive: true });
    // Make the temp directory fully readable/writable/executable by everyone natively so the limited Docker user [1000:1000] can access it.
    fs.chmodSync(tempDir, 0o777);

    // ── Gather test cases ────────────────────────────────────────────────────
    let allTests = [];
    if (question.sampleTests) {
        const st = typeof question.sampleTests === "string" ? JSON.parse(question.sampleTests) : question.sampleTests;
        allTests = allTests.concat(st);
    }
    if (question.hiddenTests) {
        const ht = typeof question.hiddenTests === "string" ? JSON.parse(question.hiddenTests) : question.hiddenTests;
        allTests = allTests.concat(ht);
    }
    if (allTests.length === 0 && question.testCases) {
        allTests = typeof question.testCases === "string" ? JSON.parse(question.testCases) : question.testCases;
    }

    if (allTests.length === 0) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
        return { allTestsPassed: false, failedMessage: "No test cases for this problem.", points: 0, ratio: "0/0" };
    }

    const volumeTarget = tempDir.replace(/\\/g, "/");
    const isCompiled = language === "cpp" || language === "java";
    const execTimeout = isCompiled ? 25000 : 12000;

    let cmd = "";

    // ══════════════════════════════════════════════════════════════════════════
    // PYTHON
    // ══════════════════════════════════════════════════════════════════════════
    if (language === "python" || language === "python3") {
        fs.writeFileSync(path.join(tempDir, "tests.json"), JSON.stringify(allTests));

        const runner = `\
import json, time, math, sys, traceback

${code}

def deep_compare(actual, expected):
    # Fix: Python treats True==1 and False==0; distinguish bools from ints
    if isinstance(expected, bool) or isinstance(actual, bool):
        return type(actual) == type(expected) and actual == expected
    if isinstance(expected, float) or isinstance(actual, float):
        try:
            return abs(float(actual) - float(expected)) < 1e-9
        except Exception:
            return False
    if isinstance(expected, list) and isinstance(actual, list):
        if len(expected) != len(actual):
            return False
        return all(deep_compare(a, b) for a, b in zip(actual, expected))
    return actual == expected

def sorted_nested(v):
    if isinstance(v, list):
        inner = [sorted_nested(x) for x in v]
        try:
            return sorted(inner)
        except TypeError:
            return sorted(inner, key=str)
    return v

if __name__ == "__main__":
    with open('/app/tests.json', 'r') as f:
        tests = json.load(f)
    results = []
    for tc in tests:
        try:
            input_val = json.loads(tc['input'])
            expected_val = json.loads(tc['expected'])
            t0 = time.perf_counter()
            is_single = tc.get('is_single_array_arg', False)
            if isinstance(input_val, list) and not is_single:
                try:
                    actual = solution(*input_val)
                except TypeError:
                    actual = solution(input_val)
            else:
                actual = solution(input_val)
            t1 = time.perf_counter()
            if actual is None:
                results.append({"passed": False, "error": "Function returned None"})
                continue
            order_ind = tc.get('orderIndependent', False)
            if order_ind and isinstance(actual, list):
                is_match = deep_compare(sorted_nested(actual), sorted_nested(expected_val))
            else:
                is_match = deep_compare(actual, expected_val)
            results.append({"passed": is_match, "actual": str(actual), "expected": str(expected_val), "durationMs": (t1-t0)*1000})
        except Exception as e:
            results.append({"passed": False, "error": traceback.format_exc().splitlines()[-1]})
    print("__codeclash_ipc__:" + json.dumps(results))
`;
        fs.writeFileSync(path.join(tempDir, "index.py"), runner);
        cmd = `docker run --rm --name judge_${testFilenameId} --stop-timeout 5 --cap-drop=ALL --security-opt no-new-privileges:true --user 1000:1000 --pids-limit 256 --memory=256m --memory-swap=256m --cpus=1.0 --network=none -v "${volumeTarget}:/app" python:3.10-slim python /app/index.py`;

    // ══════════════════════════════════════════════════════════════════════════
    // C++
    // ══════════════════════════════════════════════════════════════════════════
    } else if (language === "cpp" || language === "c") {
        let parsedTests;
        try {
            parsedTests = allTests.map(tc => ({
                input: JSON.parse(tc.input),
                expected: JSON.parse(tc.expected),
                isSingle: tc.is_single_array_arg || false,
                orderIndependent: tc.orderIndependent || false,
            }));
        } catch (e) {
            try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
            return { allTestsPassed: false, failedMessage: `Invalid test case data: ${e.message}`, points: 0, ratio: "0/0" };
        }

        const testBlocks = parsedTests.map((tc, i) => {
            const { input, expected, isSingle, orderIndependent } = tc;

            // Build named local variables for each argument so user code can
            // declare params as T, const T&, or T& — all bind to lvalues safely.
            let argDecls = "";   // e.g. "auto _a0 = ...; auto _a1 = ...;"
            let callArgs = "";   // e.g. "_a0, _a1"

            if (Array.isArray(input)) {
                const isMultiArg = (!isSingle && Array.isArray(question.args) && question.args.length > 1) ||
                                   (!isSingle && input.length > 0 && input.every(e => Array.isArray(e)));
                if (isMultiArg) {
                    const parts = input.map((arg, j) => {
                        const varName = `_arg${i}_${j}`;
                        const decl = Array.isArray(arg)
                            ? `${cppType(arg)} ${varName} = ${cppType(arg)}${cppLiteral(arg)};`
                            : `auto ${varName} = ${cppLiteral(arg)};`;
                        return { varName, decl };
                    });
                    argDecls = parts.map(p => p.decl).join("\n        ");
                    callArgs = parts.map(p => p.varName).join(", ");
                } else {
                    const varName = `_arg${i}_0`;
                    argDecls = `${cppType(input)} ${varName} = ${cppType(input)}${cppLiteral(input)};`;
                    callArgs = varName;
                }
            } else {
                const varName = `_arg${i}_0`;
                argDecls = `auto ${varName} = ${cppLiteral(input)};`;
                callArgs = varName;
            }

            const comma = i < parsedTests.length - 1 ? '","' : '""';
            const expectedLabel = escapeString(Array.isArray(expected) ? JSON.stringify(expected) : String(expected));
            const okBlock = orderIndependent
                ? cppOrderIndependentBlock("actual", expected)
                : `bool ok = (${cppEquality("actual", expected)});`;

            return `
    // Test ${i + 1}
    {
        ${argDecls}
        auto t0 = std::chrono::high_resolution_clock::now();
        auto actual = solution(${callArgs});
        auto t1 = std::chrono::high_resolution_clock::now();
        double ms = std::chrono::duration<double, std::milli>(t1 - t0).count();
        ${okBlock}
        std::cout << "{\\"passed\\":" << (ok ? "true" : "false")
                  << ",\\"durationMs\\":" << ms
                  << ",\\"expected\\":\\"${expectedLabel}\\""
                  << "}" << ${comma};
    }`;
        }).join("\n");

        const src = `\
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <deque>
#include <unordered_map>
#include <unordered_set>
#include <numeric>
#include <cmath>
#include <climits>
#include <chrono>
using namespace std;

// ── User Code ────────────────────────────────────────────────────────────────
${code}
// ─────────────────────────────────────────────────────────────────────────────

int main() {
    std::cout << "__codeclash_ipc__:[";
${testBlocks}
    std::cout << "]" << std::endl;
    return 0;
}
`;
        fs.writeFileSync(path.join(tempDir, "index.cpp"), src);
        cmd = `docker run --rm --name judge_${testFilenameId} --stop-timeout 5 --cap-drop=ALL --security-opt no-new-privileges:true --user 1000:1000 --pids-limit 256 --memory=256m --memory-swap=256m --cpus=1.0 --network=none -v "${volumeTarget}:/app" gcc:latest bash -c "g++ -O2 -std=c++17 /app/index.cpp -o /app/out && /app/out"`;

    // ══════════════════════════════════════════════════════════════════════════
    // JAVA
    // ══════════════════════════════════════════════════════════════════════════
    } else if (language === "java") {
        let parsedTests;
        try {
            parsedTests = allTests.map(tc => ({
                input: JSON.parse(tc.input),
                expected: JSON.parse(tc.expected),
                isSingle: tc.is_single_array_arg || false,
                orderIndependent: tc.orderIndependent || false,
            }));
        } catch (e) {
            try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
            return { allTestsPassed: false, failedMessage: `Invalid test case data: ${e.message}`, points: 0, ratio: "0/0" };
        }

        const userCodeClean = code.trim();

        const testBlocks = parsedTests.map((tc, i) => {
            const { input, expected, isSingle, orderIndependent } = tc;
            let callArgs = "";

            if (Array.isArray(input)) {
                const isMultiArg = (!isSingle && Array.isArray(question.args) && question.args.length > 1) ||
                                   (!isSingle && input.length > 0 && input.every(e => Array.isArray(e)));
                callArgs = isMultiArg
                    ? input.map(arg => javaLiteral(arg)).join(", ")
                    : javaLiteral(input);
            } else {
                callArgs = javaLiteral(input);
            }

            const comma = i < parsedTests.length - 1 ? '","' : '""';
            const expectedLabel = escapeString(Array.isArray(expected) ? JSON.stringify(expected) : String(expected));

            // Build equality block
            let okBlock;
            if (orderIndependent && Array.isArray(expected)) {
                const isNested2D = expected.length > 0 && Array.isArray(expected[0]);
                const expLit = javaLiteral(expected);
                if (isNested2D) {
                    okBlock = `for (int[] _r : actual) java.util.Arrays.sort(_r);
            java.util.Arrays.sort(actual, java.util.Arrays::compare);
            var _exp${i} = ${expLit};
            for (int[] _r : _exp${i}) java.util.Arrays.sort(_r);
            java.util.Arrays.sort(_exp${i}, java.util.Arrays::compare);
            boolean ok = java.util.Arrays.deepEquals(actual, _exp${i});`;
                } else {
                    okBlock = `java.util.Arrays.sort(actual);
            int[] _exp${i} = ${expLit};
            java.util.Arrays.sort(_exp${i});
            boolean ok = java.util.Arrays.equals(actual, _exp${i});`;
                }
            } else {
                okBlock = `boolean ok = (${javaEquality("actual", expected)});`;
            }

            return `
        // Test ${i + 1}
        {
            long t0 = System.nanoTime();
            var actual = sol.solution(${callArgs});
            long t1 = System.nanoTime();
            double ms = (t1 - t0) / 1_000_000.0;
            ${okBlock}
            sb.append("{\\"passed\\":").append(ok)
              .append(",\\"durationMs\\":").append(ms)
              .append(",\\"expected\\":\\"${expectedLabel}\\"")
              .append("}").append(${comma});
        }`;
        }).join("\n");

        const src = `\
import java.util.*;
import java.util.stream.*;

// ── User Code ───────────────────────────────────────────────────────────────
${userCodeClean}
// ─────────────────────────────────────────────────────────────────────────────

public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        StringBuilder sb = new StringBuilder("__codeclash_ipc__:[");
${testBlocks}
        sb.append("]");
        System.out.println(sb.toString());
    }
}
`;
        fs.writeFileSync(path.join(tempDir, "Main.java"), src);
        cmd = `docker run --rm --name judge_${testFilenameId} --stop-timeout 5 --cap-drop=ALL --security-opt no-new-privileges:true --user 1000:1000 --pids-limit 256 --memory=256m --memory-swap=256m --cpus=1.0 --network=none -v "${volumeTarget}:/app" eclipse-temurin:17-jdk-focal bash -c "javac /app/Main.java -d /app && java -cp /app Main"`;

    // ══════════════════════════════════════════════════════════════════════════
    // JAVASCRIPT / TYPESCRIPT
    // ══════════════════════════════════════════════════════════════════════════
    } else {
        fs.writeFileSync(path.join(tempDir, "tests.json"), JSON.stringify(allTests));

        let compiledCode = code;
        if (language === "typescript") {
            try {
                const ts = require("typescript");
                compiledCode = ts.transpileModule(code, {
                    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 }
                }).outputText;
            } catch (e) {
                try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
                return { allTestsPassed: false, failedMessage: "TypeScript compile error: " + e.message, points: 0, ratio: "0/0" };
            }
        }

        const runner = `\
'use strict';
const fs = require('fs');

// ── User Code ────────────────────────────────────────────────────────────────
${compiledCode}
// ─────────────────────────────────────────────────────────────────────────────

function deepCompare(actual, expected) {
    // Strict bool vs number
    if (typeof expected === 'boolean' || typeof actual === 'boolean') {
        return typeof actual === typeof expected && actual === expected;
    }
    if (typeof expected === 'number' && !Number.isInteger(expected)) {
        return typeof actual === 'number' && Math.abs(actual - expected) < 1e-9;
    }
    if (Array.isArray(expected)) {
        if (!Array.isArray(actual) || actual.length !== expected.length) return false;
        return expected.every((v, i) => deepCompare(actual[i], v));
    }
    return actual === expected || JSON.stringify(actual) === JSON.stringify(expected);
}

function sortNested(v) {
    if (!Array.isArray(v)) return v;
    const inner = v.map(sortNested);
    try { return inner.sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : 1); }
    catch (_) { return inner; }
}

const tests = JSON.parse(fs.readFileSync('/app/tests.json', 'utf8'));
const results = [];

for (const tc of tests) {
    try {
        const inputVal = JSON.parse(tc.input);
        const expectedVal = JSON.parse(tc.expected);
        const t0 = process.hrtime.bigint();
        const _log = console.log; console.log = () => {};
        let actual;
        const isMultiArg = Array.isArray(inputVal) && !tc.is_single_array_arg;
        if (isMultiArg) {
            try { actual = solution(...inputVal); } catch (_) { actual = solution(inputVal); }
        } else {
            actual = solution(inputVal);
        }
        console.log = _log;
        const t1 = process.hrtime.bigint();
        if (actual === undefined || actual === null) {
            results.push({ passed: false, error: 'Function returned undefined/null' });
            continue;
        }
        let cmpActual = actual, cmpExpected = expectedVal;
        if (tc.orderIndependent && Array.isArray(actual)) {
            cmpActual = sortNested(actual);
            cmpExpected = sortNested(expectedVal);
        }
        const isMatch = deepCompare(cmpActual, cmpExpected);
        results.push({ passed: isMatch, actual: JSON.stringify(actual), expected: JSON.stringify(expectedVal), durationMs: Number(t1 - t0) / 1e6 });
    } catch (e) {
        results.push({ passed: false, error: e.message || String(e) });
    }
}
console.log('__codeclash_ipc__:' + JSON.stringify(results));
`;
        fs.writeFileSync(path.join(tempDir, "index.js"), runner);
        cmd = `docker run --rm --name judge_${testFilenameId} --stop-timeout 5 --cap-drop=ALL --security-opt no-new-privileges:true --user 1000:1000 --pids-limit 256 --memory=256m --memory-swap=256m --cpus=1.0 --network=none -v "${volumeTarget}:/app" node:18 node /app/index.js`;
    }

    // Guard: unsupported language
    if (!cmd) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
        return { allTestsPassed: false, failedMessage: `Unsupported language: ${language}`, points: 0, ratio: "0/0" };
    }

    // ── Execute and parse results ────────────────────────────────────────────
    try {
        const rawOutput = await new Promise((resolve, reject) => {
            exec(cmd, { timeout: execTimeout }, (error, stdout, stderr) => {
                try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
                if (error && error.killed) return reject("Time Limit Exceeded (TLE)");
                if (error && (error.message.includes("137") || error.code === 137)) return reject("Memory Limit Exceeded (MLE)");
                if (error) return resolve((stdout || "") + (stderr || "") + (error.message || ""));
                resolve(stdout.trim());
            });
        });

        const ipcIdx = rawOutput.lastIndexOf("__codeclash_ipc__:");
        if (ipcIdx === -1) {
            const preview = rawOutput.replace(/\r\n/g, "\n").slice(0, 500).trim();
            return { allTestsPassed: false, failedMessage: "Compilation / Runtime Error:\n" + preview, points: 0, ratio: "0/0" };
        }

        const ipcPayload = rawOutput.slice(ipcIdx + "__codeclash_ipc__:".length).trim();
        let resultJson;
        try {
            resultJson = JSON.parse(ipcPayload);
        } catch (_) {
            return { allTestsPassed: false, failedMessage: "Judge IPC parse error – possible infinite loop or corrupted output.", points: 0, ratio: "0/0" };
        }

        let passedCount = 0;
        let failingDiff = null;
        for (let i = 0; i < resultJson.length; i++) {
            if (resultJson[i].passed) {
                passedCount++;
            } else if (!failingDiff) {
                const r = resultJson[i];
                if (r.error) {
                    failingDiff = `Test ${i + 1}: Runtime Error – ${r.error}`;
                } else if (r.actual !== undefined && r.expected !== undefined) {
                    failingDiff = `Test ${i + 1}: Wrong Answer – Expected ${r.expected}, got ${r.actual}`;
                } else if (r.expected !== undefined) {
                    failingDiff = `Test ${i + 1}: Wrong Answer – Expected ${r.expected}`;
                } else {
                    failingDiff = `Test ${i + 1}: Wrong Answer`;
                }
            }
        }

        const total = resultJson.length;
        const ratio = `${passedCount}/${total}`;

        if (passedCount === total) {
            const sampleCount = Math.min(
                typeof question.sampleTests === "string"
                    ? JSON.parse(question.sampleTests).length
                    : (question.sampleTests || []).length,
                total
            );
            const hiddenCount = total - sampleCount;
            const points = Math.round(10 + hiddenCount * 2);
            return { allTestsPassed: true, failedMessage: null, points, ratio };
        }

        return { allTestsPassed: false, failedMessage: failingDiff || "Some tests failed.", points: 0, ratio };

    } catch (outerErr) {
        return { allTestsPassed: false, failedMessage: String(outerErr), points: 0, ratio: "0/0" };
    } finally {
        exec(`docker rm -f judge_${testFilenameId}`, () => {});
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
    }
}

module.exports = { executeCode };
