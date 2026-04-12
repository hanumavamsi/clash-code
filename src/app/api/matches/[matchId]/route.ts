import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

// GET /api/matches/[matchId]
// Get full match details with questions (auth-gated to users who participated)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ matchId: string }> }
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

        const matchId = (await params).matchId;

        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                player1: { select: { id: true, name: true, image: true, eloRating: true } },
                player2: { select: { id: true, name: true, image: true, eloRating: true } },
                room: { select: { id: true } }
            }
        });

        if (!match) {
            return NextResponse.json({ error: "Match not found" }, { status: 404 });
        }

        // Auth check: user must be one of the players
        if (match.player1Id !== user.id && match.player2Id !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch questions that were in this match
        const questions = match.questionIds && match.questionIds.length > 0
            ? await prisma.question.findMany({
                where: { id: { in: match.questionIds } },
                select: {
                    id: true,
                    title: true,
                    difficulty: true,
                    description: true,
                    args: true,
                    returnType: true,
                    sampleTests: true,
                    constraints: true
                }
            })
            : [];

        // Fetch user's submissions for these questions in this match
        // (We store submissions but don't currently link them to matches, so we'll get all by userId/questionId)
        const submissions = await prisma.submission.findMany({
            where: {
                userId: user.id,
                questionId: { in: match.questionIds || [] }
            },
            select: {
                id: true,
                questionId: true,
                code: true,
                status: true,
                executionTime: true,
                createdAt: true
            }
        });

        // Determine outcome
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

        return NextResponse.json({
            match: {
                id: match.id,
                roomId: match.room?.id,
                outcome,
                startTime: match.startTime,
                endTime: match.endTime,
                duration: match.endTime && match.startTime
                    ? Math.floor((match.endTime.getTime() - match.startTime.getTime()) / 1000 / 60)
                    : null,
                player1: match.player1,
                player2: match.player2,
                winnerId: match.winnerId,
                elo: {
                    before: eloBefore,
                    after: eloAfter,
                    delta: eloDelta
                }
            },
            questions: questions.map(q => ({
                ...q,
                submission: submissions.find(s => s.questionId === q.id)
            }))
        });
    } catch (error) {
        console.error("[API] /api/matches/[matchId] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
