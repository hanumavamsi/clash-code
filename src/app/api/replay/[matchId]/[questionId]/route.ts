import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { ReplayContextResponse } from "@/types/replay";

const prisma = new PrismaClient();

// GET /api/replay/[matchId]/[questionId]
// Fetch question + user's previous submission from that match
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ matchId: string; questionId: string }> }
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

        const { matchId, questionId } = await params;

        // Get match details
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                player1: { select: { id: true, name: true, image: true, eloRating: true } },
                player2: { select: { id: true, name: true, image: true, eloRating: true } }
            }
        });

        if (!match) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        // Auth check: user must be one of the players
        if (match.player1Id !== user.id && match.player2Id !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Check that this question was in the match
        if (!match.questionIds?.includes(questionId)) {
            return NextResponse.json({ error: "Question not in match" }, { status: 400 });
        }

        // Get question details
        const question = await prisma.question.findUnique({
            where: { id: questionId },
            select: {
                id: true,
                title: true,
                difficulty: true,
                description: true,
                args: true,
                returnType: true,
                constraints: true,
                sampleTests: true
            }
        });

        if (!question) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        // Get user's last submission for this question from this match
        const submission = await prisma.submission.findFirst({
            where: {
                userId: user.id,
                questionId: questionId,
                ...(match.startTime && {
                    createdAt: {
                        gte: match.startTime,
                        lte: match.endTime || new Date()
                    }
                })
            },
            select: {
                code: true,
                status: true,
                executionTime: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Determine outcome relative to current user
        let outcome: 'win' | 'loss' | 'draw' = 'draw';
        if (match.winnerId === user.id) {
            outcome = 'win';
        } else if (match.winnerId && match.winnerId !== user.id) {
            outcome = 'loss';
        }

        const isPlayer1 = match.player1Id === user.id;
        const eloData = match.eloAfter as any;
        const userEloData = eloData?.[isPlayer1 ? 'p1' : 'p2'];
        const eloDelta = userEloData?.delta;
        const eloAfter = userEloData?.new;
        const eloBefore = userEloData?.old;

        const response: ReplayContextResponse = {
            match: {
                id: match.id,
                player1: match.player1!,
                player2: match.player2!,
                outcome,
                elo: {
                    before: eloBefore,
                    after: eloAfter,
                    delta: eloDelta
                },
                endTime: match.endTime,
                startTime: match.startTime,
                duration: match.endTime && match.startTime
                    ? Math.floor((match.endTime.getTime() - match.startTime.getTime()) / 1000 / 60)
                    : undefined
            },
            question: {
                id: question.id,
                title: question.title,
                description: question.description,
                difficulty: question.difficulty as 'Easy' | 'Medium' | 'Hard',
                args: question.args as string[],
                returnType: question.returnType as string,
                constraints: question.constraints as string[],
                sampleTests: question.sampleTests as any
            },
            userSubmission: {
                code: submission?.code || '',
                language: 'javascript', // Note: language not stored in submissions, defaulting to javascript
                status: (submission?.status as any) || 'PENDING',
                executionTime: submission?.executionTime || undefined
            }
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("[API] /api/replay/[matchId]/[questionId] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
