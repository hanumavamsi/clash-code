const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTests() {
    const q = await prisma.question.findFirst({
        where: { title: "Longest Palindromic Substring" }
    });
    
    if (q) {
        await prisma.question.update({
            where: { id: q.id },
            data: {
                args: ["string"],
                returnType: "string",
                sampleTests: [
                    { input: '"babad"', expected: '"bab"' },
                    { input: '"cbbd"', expected: '"bb"' },
                    { input: '"a"', expected: '"a"' },
                    { input: '"ac"', expected: '"a"' }
                ],
                hiddenTests: [
                    { input: '"racecar"', expected: '"racecar"' },
                    { input: '"abb"', expected: '"bb"' }
                ]
            }
        });
        console.log("Fixed DB testcases for Longest Palindromic Substring!");
    } else {
        console.log("Question not found.");
    }
    
    // Also let's fix Two Sum while we are here:
    const q2 = await prisma.question.findFirst({
        where: { title: "Two Sum" }
    });
    if (q2) {
        await prisma.question.update({
            where: { id: q2.id },
            data: {
                args: ["integer[]", "integer"],
                returnType: "integer[]",
                sampleTests: [
                    { input: '[[2,7,11,15], 9]', expected: '[0,1]', is_single_array_arg: false },
                    { input: '[[3,2,4], 6]', expected: '[1,2]', is_single_array_arg: false },
                    { input: '[[3,3], 6]', expected: '[0,1]', is_single_array_arg: false }
                ],
                hiddenTests: []
            }
        });
        console.log("Fixed DB testcases for Two Sum!");
    }
    
    prisma.$disconnect();
}

fixTests();
