const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const problems = [
  {
    title: "Two Sum",
    difficulty: "easy",
    args: ["integer[]", "integer"],
    returnType: "integer[]",
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    sampleTests: [
      { input: "[[2,7,11,15], 9]", expected: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].", is_single_array_arg: false, orderIndependent: true },
      { input: "[[3,2,4], 6]", expected: "[1,2]", is_single_array_arg: false, orderIndependent: true },
      { input: "[[3,3], 6]", expected: "[0,1]", is_single_array_arg: false, orderIndependent: true }
    ],
    hiddenTests: [
      { input: "[[2,5,5,11], 10]", expected: "[1,2]", is_single_array_arg: false, orderIndependent: true },
      { input: "[[-3,4,3,90], 0]", expected: "[0,2]", is_single_array_arg: false, orderIndependent: true }
    ]
  },
  {
    title: "Valid Parentheses",
    difficulty: "easy",
    args: ["string"],
    returnType: "boolean",
    constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'."],
    description: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    sampleTests: [
      { input: "\"()\"", expected: "true" },
      { input: "\"()[]{}\"", expected: "true" },
      { input: "\"(]\"", expected: "false" }
    ],
    hiddenTests: [
      { input: "\"([)]\"", expected: "false" },
      { input: "\"{[]}\"", expected: "true" },
      { input: "\"\"", expected: "true" }
    ]
  },
  {
    title: "Maximum Subarray",
    difficulty: "easy",
    args: ["integer[]"],
    returnType: "integer",
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
    sampleTests: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expected: "6" },
      { input: "[1]", expected: "1" },
      { input: "[5,4,-1,7,8]", expected: "23" }
    ],
    hiddenTests: [
      { input: "[-1]", expected: "-1" },
      { input: "[-2,-1]", expected: "-1" }
    ]
  },
  {
    title: "Reverse String",
    difficulty: "easy",
    args: ["string"],
    returnType: "string",
    constraints: ["1 <= s.length <= 10^5"],
    description: "Write a function that reverses a string.",
    sampleTests: [
      { input: "\"hello\"", expected: "\"olleh\"" },
      { input: "\"Hannah\"", expected: "\"hannaH\"" }
    ],
    hiddenTests: [
      { input: "\"a\"", expected: "\"a\"" },
      { input: "\"\"", expected: "\"\"" }
    ]
  },
  {
    title: "Climbing Stairs",
    difficulty: "easy",
    args: ["integer"],
    returnType: "integer",
    constraints: ["1 <= n <= 45"],
    description: "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?",
    sampleTests: [
      { input: "2", expected: "2" },
      { input: "3", expected: "3" }
    ],
    hiddenTests: [
      { input: "1", expected: "1" },
      { input: "4", expected: "5" },
      { input: "5", expected: "8" }
    ]
  },
  {
    title: "Longest Palindromic Substring",
    difficulty: "medium",
    args: ["string"],
    returnType: "string",
    constraints: ["1 <= s.length <= 1000", "s consist of only digits and English letters."],
    description: "Given a string `s`, return the longest palindromic substring in `s`.",
    sampleTests: [
      { input: "\"babad\"", expected: "\"bab\"" },
      { input: "\"cbbd\"", expected: "\"bb\"" }
    ],
    hiddenTests: [
      { input: "\"a\"", expected: "\"a\"" },
      { input: "\"ac\"", expected: "\"a\"" },
      { input: "\"racecar\"", expected: "\"racecar\"" }
    ]
  },
  {
    title: "Longest Substring Without Repeating",
    difficulty: "medium",
    args: ["string"],
    returnType: "integer",
    constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
    description: "Given a string `s`, find the length of the longest substring without repeating characters.",
    sampleTests: [
      { input: "\"abcabcbb\"", expected: "3" },
      { input: "\"bbbbb\"", expected: "1" },
      { input: "\"pwwkew\"", expected: "3" }
    ],
    hiddenTests: [
      { input: "\"\"", expected: "0" },
      { input: "\"a\"", expected: "1" },
      { input: "\"au\"", expected: "2" },
      { input: "\"dvdf\"", expected: "3" }
    ]
  },
  {
    title: "Container With Most Water",
    difficulty: "medium",
    args: ["integer[]"],
    returnType: "integer",
    constraints: ["n == height.length", "2 <= n <= 10^5", "0 <= height[i] <= 10^4"],
    description: "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i^th` line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.",
    sampleTests: [
      { input: "[1,8,6,2,5,4,8,3,7]", expected: "49" },
      { input: "[1,1]", expected: "1" }
    ],
    hiddenTests: [
      { input: "[4,3,2,1,4]", expected: "16" },
      { input: "[1,2,1]", expected: "2" }
    ]
  },
  {
    title: "Product of Array Except Self",
    difficulty: "medium",
    args: ["integer[]"],
    returnType: "integer[]",
    constraints: ["2 <= nums.length <= 10^5", "-30 <= nums[i] <= 30"],
    description: "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.",
    sampleTests: [
      { input: "[1,2,3,4]", expected: "[24,12,8,6]" },
      { input: "[-1,1,0,-3,3]", expected: "[0,0,9,0,0]" }
    ],
    hiddenTests: [
      { input: "[0,0]", expected: "[0,0]" },
      { input: "[1,0]", expected: "[0,1]" }
    ]
  },
  {
    title: "3Sum",
    difficulty: "medium",
    args: ["integer[]"],
    returnType: "integer[][]",
    constraints: ["3 <= nums.length <= 3000", "-10^5 <= nums[i] <= 10^5"],
    description: "Given an integer array nums, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.\n\nNotice that the solution set must not contain duplicate triplets.",
    sampleTests: [
      { input: "[-1,0,1,2,-1,-4]", expected: "[[-1,-1,2],[-1,0,1]]", orderIndependent: true },
      { input: "[0,1,1]", expected: "[]", orderIndependent: true },
      { input: "[0,0,0]", expected: "[[0,0,0]]", orderIndependent: true }
    ],
    hiddenTests: [
      { input: "[0,0,0,0]", expected: "[[0,0,0]]", orderIndependent: true }
    ]
  },
  {
    title: "Merge Intervals",
    difficulty: "hard",
    args: ["integer[][]"],
    returnType: "integer[][]",
    constraints: ["1 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start_i <= end_i <= 10^4"],
    description: "Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    sampleTests: [
      { input: "[[1,3],[2,6],[8,10],[15,18]]", expected: "[[1,6],[8,10],[15,18]]", orderIndependent: true },
      { input: "[[1,4],[4,5]]", expected: "[[1,5]]", orderIndependent: true }
    ],
    hiddenTests: [
      { input: "[[1,4],[0,4]]", expected: "[[0,4]]", orderIndependent: true },
      { input: "[[1,4],[2,3]]", expected: "[[1,4]]", orderIndependent: true }
    ]
  },
  {
    title: "Word Break",
    difficulty: "hard",
    args: ["string", "string[]"],
    returnType: "boolean",
    constraints: ["1 <= s.length <= 300", "1 <= wordDict.length <= 1000", "1 <= wordDict[i].length <= 20", "s and wordDict[i] consist of only lowercase English letters.", "All the strings of wordDict are unique."],
    description: "Given a string `s` and a dictionary of strings `wordDict`, return `true` if `s` can be segmented into a space-separated sequence of one or more dictionary words.\n\nNote that the same word in the dictionary may be reused multiple times in the segmentation.",
    sampleTests: [
      { input: "[\"leetcode\", [\"leet\",\"code\"]]", expected: "true", is_single_array_arg: false },
      { input: "[\"applepenapple\", [\"apple\",\"pen\"]]", expected: "true", is_single_array_arg: false },
      { input: "[\"catsandog\", [\"cats\",\"dog\",\"sand\",\"and\",\"cat\"]]", expected: "false", is_single_array_arg: false }
    ],
    hiddenTests: [
      { input: "[\"a\", [\"a\"]]", expected: "true", is_single_array_arg: false },
      { input: "[\"aaaaaaa\", [\"aaaa\",\"aaa\"]]", expected: "true", is_single_array_arg: false }
    ]
  }
];

async function seed() {
  console.log("Wiping existing questions and submissions...");
  await prisma.submission.deleteMany({});
  await prisma.question.deleteMany({});
  
  console.log("Seeding 12 curated problems...");
  let count = 0;
  for (const q of problems) {
    let fullDescription = q.description + "\n\n";
    
    // Dynamically append LeetCode style examples based on sampleTests
    if (q.sampleTests && q.sampleTests.length > 0) {
        q.sampleTests.forEach((test, index) => {
            // Format input nicely based on whether there are multiple args
            let inputStr = test.input;
            if (q.args.length > 1 && test.is_single_array_arg === false) {
                try {
                    const parsedArgs = JSON.parse(test.input);
                    if (Array.isArray(parsedArgs)) {
                       const paramNames = q.title === "Two Sum" ? ["nums", "target"] :
                                          q.title === "Word Break" ? ["s", "wordDict"] :
                                          q.args.map((_, i) => Object.keys(parsedArgs)[i] || `arg${i}`);
                       inputStr = parsedArgs.map((arg, i) => `${paramNames[i] || `arg${i}`} = ${JSON.stringify(arg)}`).join(", ");
                    }
                } catch (e) {}
            } else if (q.args.length === 1) {
                const paramName = q.title === "Valid Parentheses" || q.title === "Reverse String" || q.title === "Longest Palindromic Substring" || q.title === "Longest Substring Without Repeating" ? "s" :
                                  q.title === "Climbing Stairs" ? "n" :
                                  "nums";
                inputStr = `${paramName} = ${test.input}`;
            }

            fullDescription += `<p class="font-bold text-white mt-6 mb-2">Example ${index + 1}:</p>\n`;
            fullDescription += `<div class="bg-dark-900/50 border border-white/5 rounded-xl p-4 mb-4 font-mono text-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">`;
            fullDescription += `<div class="mb-1"><span class="font-bold text-brand-400">Input:</span> <span class="text-dark-200">${inputStr}</span></div>`;
            fullDescription += `<div class="mb-1"><span class="font-bold text-brand-400">Output:</span> <span class="text-green-400">${test.expected}</span></div>`;
            if (test.explanation) {
                fullDescription += `<div><span class="font-bold text-brand-400">Explanation:</span> <span class="text-dark-300 font-sans">${test.explanation}</span></div>`;
            }
            fullDescription += `</div>\n`;
        });
    }

    if (q.constraints && q.constraints.length > 0) {
        fullDescription += `<p class="font-bold text-white mt-8 mb-3">Constraints:</p>\n`;
        fullDescription += `<ul class="list-disc pl-5 space-y-2 text-dark-300">\n`;
        q.constraints.forEach(constraint => {
            // Replace e.g., 10^4 with 10<sup>4</sup> and code blocks smoothly
            let clean = constraint.replace(/10\^(\d+)/g, "10<sup>$1</sup>");
            fullDescription += `  <li class="pl-1"><code class="bg-dark-800 px-2 py-0.5 rounded text-xs border border-white/10 text-brand-100">${clean}</code></li>\n`;
        });
        fullDescription += `</ul>\n`;
    }

    await prisma.question.create({
      data: {
        title: q.title,
        difficulty: q.difficulty,
        args: q.args,
        returnType: q.returnType,
        constraints: q.constraints,
        description: fullDescription,
        sampleTests: q.sampleTests,
        hiddenTests: q.hiddenTests
      }
    });
    count++;
  }
  
  console.log(`Successfully seeded ${count} problems.`);
  await prisma.$disconnect();
}

seed().catch(e => {
  console.error("Error seeding:", e);
  process.exit(1);
});
