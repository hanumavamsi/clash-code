import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { MatchPracticeContextResponse } from "@/types/replay";

const prisma = new PrismaClient();

// GET /api/replay/[matchId]
// Fetch all questions + user's submissions for a full match practice session
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ matchId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const userSession = session?.user as any;
        if (!userSession?.id && !userSession?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: userSession.id
                ? { id: userSession.id }
                : { email: userSession.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { matchId } = await params;

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

        const questionIds: string[] = match.questionIds ?? [];

        if (questionIds.length === 0) {
            return NextResponse.json({ error: "No questions in match" }, { status: 400 });
        }

        // Fetch all questions
        const questions = await prisma.question.findMany({
            where: { id: { in: questionIds } },
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

        // Preserve match order
        const orderedQuestions = questionIds
            .map(id => questions.find(q => q.id === id))
            .filter(Boolean) as typeof questions;

        // Fetch all user submissions for this match (one per question — the last one during match window)
        const submissionMap = new Map<string, { code: string; status: string; executionTime: number | null }>();

        await Promise.all(
            questionIds.map(async (questionId) => {
                const submission = await prisma.submission.findFirst({
                    where: {
                        userId: user.id,
                        questionId,
                        ...(match.startTime && {
                            createdAt: {
                                gte: match.startTime,
                                lte: match.endTime || new Date()
                            }
                        })
                    },
                    select: { code: true, status: true, executionTime: true },
                    orderBy: { createdAt: "desc" }
                });
                if (submission) {
                    submissionMap.set(questionId, submission);
                }
            })
        );

        // Determine outcome
        let outcome: "win" | "loss" | "draw" = "draw";
        if (match.winnerId === user.id) {
            outcome = "win";
        } else if (match.winnerId && match.winnerId !== user.id) {
            outcome = "loss";
        }

        const isPlayer1 = match.player1Id === user.id;
        const eloData = match.eloAfter as any;
        const userEloData = eloData?.[isPlayer1 ? "p1" : "p2"];

        const response: MatchPracticeContextResponse = {
            match: {
                id: match.id,
                player1: match.player1!,
                player2: match.player2!,
                outcome,
                elo: {
                    before: userEloData?.old,
                    after: userEloData?.new,
                    delta: userEloData?.delta
                },
                endTime: match.endTime,
                startTime: match.startTime,
                duration:
                    match.endTime && match.startTime
                        ? Math.floor(
                              (match.endTime.getTime() - match.startTime.getTime()) / 1000 / 60
                          )
                        : undefined
            },
            questions: orderedQuestions.map((q) => {
                const sub = submissionMap.get(q.id);
                return {
                    id: q.id,
                    title: q.title,
                    description: q.description,
                    difficulty: (q.difficulty.charAt(0).toUpperCase() +
                        q.difficulty.slice(1)) as "Easy" | "Medium" | "Hard",
                    args: q.args as string[],
                    returnType: q.returnType as string,
                    constraints: q.constraints as string[],
                    sampleTests: q.sampleTests as any,
                    userSubmission: sub
                        ? {
                              code: sub.code,
                              language: "javascript",
                              status: sub.status as "ACCEPTED" | "WRONG_ANSWER" | "PENDING"
                          }
                        : null
                };
            })
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("[API] /api/replay/[matchId] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
