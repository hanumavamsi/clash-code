const fs = require('fs');

const problems = [];

// Helper to generate large arrays
const generateArray = (size, min = -1000, max = 1000) => {
    return Array.from({ length: size }, () => Math.floor(Math.random() * (max - min + 1)) + min);
};

// 1. Two Sum
const twoSumTests = [
    { input: "[2,7,11,15]\n9", expected: "[0,1]", isSample: true },
    { input: "[3,2,4]\n6", expected: "[1,2]", isSample: true },
];
for(let i=0; i<48; i++) {
    const arr = generateArray(100 + i*20, -1000, 1000);
    // Guarantee a solution exists
    const idx1 = Math.floor(Math.random() * arr.length);
    let idx2 = Math.floor(Math.random() * arr.length);
    while (idx1 === idx2) idx2 = Math.floor(Math.random() * arr.length);
    const target = arr[idx1] + arr[idx2];
    // This expects our strict judge to just check if arr[result[0]]+arr[result[1]] == target. 
    // To make it deterministic for direct string compare, we can sort the results.
}
// Wait, generating exact expected outputs for generic problems is hard unless we write a Reference Solution in JS to compute them!
// Let's do that!

const generateProblem = (id, title, difficulty, description, args, returnType, refSolution, testGenerators) => {
    let tests = [];
    
    // Manual samples
    testGenerators.samples.forEach(sample => {
        const expected = refSolution(...sample);
        tests.push({ input: sample.map(s => JSON.stringify(s)).join('\n'), expected: JSON.stringify(expected), isSample: true });
    });

    // Hidden large loads
    testGenerators.hidden.forEach(hiddenArgs => {
        const expected = refSolution(...hiddenArgs);
        tests.push({ input: hiddenArgs.map(s => JSON.stringify(s)).join('\n'), expected: JSON.stringify(expected), isSample: false });
    });

    problems.push({ id, title, difficulty, description, args, returnType, tests });
};


// 1. Sum of Array
generateProblem(
    "q_sum_array", "Sum of Array", "easy", "Write a function `solution(arr)` that returns the sum of all elements in the array `arr`.",
    ["intArray"], "int",
    (arr) => arr.reduce((a, b) => a + b, 0),
    {
        samples: [[[1, 2, 3]], [[-1, 5, 10]]],
        hidden: Array.from({length: 48}, (_, i) => [generateArray(10 + i * 500, -10000, 10000)]) // scaling up to 25k elements
    }
);

// 2. Reverse String
generateProblem(
    "q_rev_str", "Reverse String", "easy", "Write a function `solution(str)` that reverses a given string `str`.",
    ["string"], "string",
    (str) => str.split('').reverse().join(''),
    {
        samples: [["hello"], ["codeclash"]],
        hidden: Array.from({length: 48}, (_, i) => {
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
            const len = 10 + i * 200;
            let str = '';
            for(let j=0; j<len; j++) str += chars.charAt(Math.floor(Math.random() * chars.length));
            return [str];
        }) // up to 10k logic
    }
);

// 3. Maximum Subarray
generateProblem(
    "q_max_sub", "Maximum Subarray", "medium", "Write a function `solution(arr)` that finds the contiguous subarray (containing at least one number) which has the largest sum and returns its sum.",
    ["intArray"], "int",
    (arr) => {
        let max_so_far = -Infinity, current_max = 0;
        for (let i = 0; i < arr.length; i++) {
            current_max = current_max + arr[i];
            if (max_so_far < current_max) max_so_far = current_max;
            if (current_max < 0) current_max = 0;
        }
        return max_so_far;
    },
    {
        samples: [[[-2,1,-3,4,-1,2,1,-5,4]], [[1]]],
        hidden: Array.from({length: 48}, (_, i) => [generateArray(50 + i * 1000, -500, +500)]) // up to 50k
    }
);

// 4. Valid Palindrome
generateProblem(
    "q_palindrome", "Valid Palindrome", "easy", "Write a function `solution(str)` that returns true if the string is a palindrome. Ignore spaces and case.",
    ["string"], "bool",
    (str) => {
        const clean = str.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
        return clean === clean.split('').reverse().join('');
    },
    {
        samples: [["A man a plan a canal Panama"], ["race car"], ["hello"]],
        hidden: Array.from({length: 47}, (_, i) => {
            const isPal = i % 2 === 0;
            let str = "";
            const chars = "abcdefghijklmnopqrstuvwxyz";
            const len = 50 + i * 200;
            for(let j=0; j<len; j++) str += chars.charAt(Math.floor(Math.random() * chars.length));
            if (isPal) return [str + str.split('').reverse().join('')];
            return [str + "a"];
        })
    }
);

// 5. Contains Duplicate
generateProblem(
    "q_contains_dup", "Contains Duplicate", "easy", "Write a function `solution(arr)` that returns true if any value appears at least twice in the array, and false if every element is distinct.",
    ["intArray"], "bool",
    (arr) => {
        return new Set(arr).size !== arr.length;
    },
    {
        samples: [[[1,2,3,1]], [[1,2,3,4]]],
        hidden: Array.from({length: 48}, (_, i) => {
            const hasDup = i % 2 === 0;
            const arr = generateArray(100 + i * 500, 1, 1000000);
            if (!hasDup) {
                return [Array.from(new Set(arr))];
            } else {
                arr.push(arr[0]);
                return [arr];
            }
        })
    }
);

// We will generate a massive dataset for these 5 core foundational problems first to test the Runner architecture.
// Later we can easily add 45 more using this exact framework.

fs.writeFileSync('prisma/seeded_problems.json', JSON.stringify(problems, null, 2));
console.log(`Successfully generated ${problems.length} problems with MASSIVE hidden test case payloads!`);
