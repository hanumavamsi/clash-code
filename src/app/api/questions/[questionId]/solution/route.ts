import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET /api/questions/[questionId]/solution?lang=javascript
// Get editorial solution (only if user has played this question in a match)
// Returns solution for requested language, falls back to any available language.
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ questionId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
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
        const requestedLang = req.nextUrl.searchParams.get("lang") || "javascript";

        // Fetch the question
        const question = await prisma.question.findUnique({
            where: { id: questionId },
            select: {
                id: true,
                title: true,
                solutions: true
            }
        });

        if (!question) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        const solutionsMap = question.solutions as Record<string, string> | null;

        if (!solutionsMap || Object.keys(solutionsMap).length === 0) {
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

        // Return solution for requested lang, fall back to any available lang
        const LANG_PRIORITY = ["javascript", "typescript", "python", "java", "cpp"];
        let resolvedLang = requestedLang;
        let solutionCode = solutionsMap[requestedLang];

        if (!solutionCode) {
            const fallback = LANG_PRIORITY.find(l => solutionsMap[l]);
            resolvedLang = fallback ?? Object.keys(solutionsMap)[0];
            solutionCode = solutionsMap[resolvedLang];
        }

        return NextResponse.json({
            questionId: question.id,
            title: question.title,
            solution: solutionCode,
            language: resolvedLang,
            availableLanguages: Object.keys(solutionsMap)
        });
    } catch (error) {
        console.error("[API] /api/questions/[questionId]/solution error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
