import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

// GET /api/questions/[questionId]/solution
// Get editorial solution (only if user has played this question in a match)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ questionId: string }> }
) {
    try {
        const session = await getServerSession();
        const userSession = session?.user as any;
        if (!userSession?.id && !userSession?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Try to find user by ID first (from JWT), then by email
        const user = await prisma.user.findUnique({
            where: userSession.id
                ? { id: userSession.id }
                : { email: userSession.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const questionId = (await params).questionId;

        // Fetch the question
        const question = await prisma.question.findUnique({
            where: { id: questionId },
            select: {
                id: true,
                title: true,
                solution: true,
                solutionLanguage: true
            }
        });

        if (!question) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        if (!question.solution) {
            return NextResponse.json(
                { error: "No solution available for this question" },
                { status: 404 }
            );
        }

        // Access control: verify user has played a match with this question
        const userMatchWithQuestion = await prisma.match.findFirst({
            where: {
                questionIds: { has: questionId },
                OR: [
                    { player1Id: user.id },
                    { player2Id: user.id }
                ]
            },
            select: { id: true }
        });

        if (!userMatchWithQuestion) {
            return NextResponse.json(
                { error: "You can only view solutions for questions you've played" },
                { status: 403 }
            );
        }

        return NextResponse.json({
            questionId: question.id,
            title: question.title,
            solution: question.solution,
            language: question.solutionLanguage || "javascript"
        });
    } catch (error) {
        console.error("[API] /api/questions/[questionId]/solution error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
