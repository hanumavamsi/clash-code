import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { TestExecutionResponse } from "@/types/replay";

const prisma = new PrismaClient();

interface TestExecutionRequest {
  code: string;
  language: string;
}

// POST /api/replay/test/[questionId]
// Execute code against test cases (no ELO update, no match record)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ questionId: string }> }
) {
    try {
        const session = await getServerSession();
        const userSession = session?.user as any;
        if (!userSession?.id && !userSession?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: TestExecutionRequest = await req.json();
        const { code, language } = body;

        if (!code || !language) {
            return NextResponse.json(
                { error: "Missing code or language" },
                { status: 400 }
            );
        }

        const questionId = (await params).questionId;

        // Get question details
        const question = await prisma.question.findUnique({
            where: { id: questionId },
            select: {
                id: true,
                title: true,
                sampleTests: true
            }
        });

        if (!question) {
            return NextResponse.json(
                { error: "Question not found" },
                { status: 404 }
            );
        }

        // For now, return simulated test results
        // In a real implementation, this would execute code against actual test cases
        // This is a placeholder that demonstrates the structure
        const sampleTests = (question.sampleTests as any[]) || [];

        const results: TestExecutionResponse = {
            passed: 0,
            total: sampleTests.length,
            results: [],
            executionTime: 0
        };

        // Simulate test execution
        // NOTE: In production, you would:
        // 1. Compile/prepare the code
        // 2. Run against each test case
        // 3. Capture output and compare with expected
        // 4. Record execution time

        let totalTime = 0;
        for (let i = 0; i < sampleTests.length; i++) {
            const testCase = sampleTests[i];

            // Simulate execution time between 1-5ms per test
            const executionTime = Math.floor(Math.random() * 4) + 1;
            totalTime += executionTime;

            // For demo purposes, assume first test passes, others may fail
            // In production, actually execute the code
            const passed = i === 0; // Placeholder logic

            results.results.push({
                testCase: i,
                passed,
                expected: testCase.expected || "result",
                actual: passed ? (testCase.expected || "result") : "different_result",
                executionTime,
                error: passed ? undefined : "Output mismatch"
            });

            if (passed) {
                results.passed++;
            }
        }

        results.executionTime = totalTime;

        return NextResponse.json(results);
    } catch (error) {
        console.error("[API] /api/replay/test/[questionId] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
