function mapType(type: string, lang: string, forReturn = false): string {
  const is2DArray = type.endsWith("[][]");
  const is1DArray = !is2DArray && type.endsWith("[]");
  const base = type.replace(/\[\](\[\])?$/, "");
  let mapped = base;

  if (lang === "cpp" || lang === "c") {
    mapped = base === "integer" ? "int" : base === "boolean" ? "bool" : base === "string" ? "string" : base;
    if (is2DArray) return forReturn ? `vector<vector<${mapped}>>` : `const vector<vector<${mapped}>>&`;
    if (is1DArray) return forReturn ? `vector<${mapped}>` : `const vector<${mapped}>&`;
    return mapped;
  }
  if (lang === "java") {
    mapped = base === "integer" ? "int" : base === "boolean" ? "boolean" : base === "string" ? "String" : base;
    if (is2DArray) return `${mapped}[][]`;
    if (is1DArray) return `${mapped}[]`;
    return mapped;
  }
  if (lang === "typescript") {
    mapped = base === "integer" ? "number" : base === "boolean" ? "boolean" : base === "string" ? "string" : "any";
    if (is2DArray) return `${mapped}[][]`;
    if (is1DArray) return `${mapped}[]`;
    return mapped;
  }
  return type;
}

export function getDefaultCode(q: { title: string; args?: string[]; returnType?: string }, lang: string): string {
  if (!q) return "";
  const argsTypes = q.args && q.args.length > 0 ? q.args : ["integer[]"];
  const retType = q.returnType || "integer";
  const cppParams = argsTypes.map((t, i) => `${mapType(t, "cpp", false)} arg${i}`).join(", ");
  const cppRet = mapType(retType, "cpp", true);
  const javaParams = argsTypes.map((t, i) => `${mapType(t, "java")} arg${i}`).join(", ");
  const tsParams = argsTypes.map((t, i) => `arg${i}: ${mapType(t, "typescript")}`).join(", ");
  const untypedParams = argsTypes.map((_, i) => `arg${i}`).join(", ");

  if (lang === "python" || lang === "python3")
    return `import math, sys, collections\n\n# Solve: ${q.title}\ndef solution(${untypedParams}):\n    pass\n`;
  if (lang === "cpp" || lang === "c")
    return `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <unordered_map>\n#include <unordered_set>\nusing namespace std;\n\n// Solve: ${q.title}\n${cppRet} solution(${cppParams}) {\n    \n}\n`;
  if (lang === "java")
    return `import java.util.*;\n\n// Solve: ${q.title}\nclass Solution {\n    public ${mapType(retType, "java")} solution(${javaParams}) {\n        \n    }\n}\n`;
  if (lang === "typescript")
    return `// Solve: ${q.title}\nfunction solution(${tsParams}): ${mapType(retType, "typescript")} {\n  \n}\n`;
  return `// Solve: ${q.title}\nfunction solution(${untypedParams}) {\n  \n}\n`;
}
