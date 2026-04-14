import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET /api/matches?limit=10&offset=0
// Get current user's match history (paginated)
export async function GET(req: NextRequest) {
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

        // Get pagination params
        const url = new URL(req.url);
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50); // Max 50
        const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

        // Get matches where user was player 1 or player 2, ordered by date descending
        const [matchesAsP1, matchesAsP2, totalCount] = await Promise.all([
            prisma.match.findMany({
                where: { player1Id: user.id },
                include: {
                    player2: { select: { id: true, name: true, image: true, eloRating: true } },
                    player1: { select: { id: true, name: true, image: true, eloRating: true } }
                },
                orderBy: { endTime: "desc" },
                take: limit,
                skip: offset
            }),
            prisma.match.findMany({
                where: { player2Id: user.id },
                include: {
                    player1: { select: { id: true, name: true, image: true, eloRating: true } },
                    player2: { select: { id: true, name: true, image: true, eloRating: true } }
                },
                orderBy: { endTime: "desc" },
                take: limit,
                skip: offset
            }),
            prisma.match.count({
                where: {
                    OR: [
                        { player1Id: user.id },
                        { player2Id: user.id }
                    ]
                }
            })
        ]);

        // Merge and sort by date, filter out matches with missing player data
        const allMatches = [...matchesAsP1, ...matchesAsP2]
            .filter(m => m.player1Id && m.player2Id) // Filter out incomplete matches
            .sort((a, b) => (b.endTime?.getTime() ?? 0) - (a.endTime?.getTime() ?? 0))
            .slice(0, limit);

        // Format response with outcome relative to current user
        const formattedMatches = allMatches.map(match => {
            const isPlayer1 = match.player1Id === user.id;
            const opponent = isPlayer1 ? match.player2 : match.player1;

            // Guard against null opponent (shouldn't happen after filter, but be safe)
            if (!opponent) return null;

            const eloData = match.eloAfter as any;
            const userEloData = eloData?.[isPlayer1 ? 'p1' : 'p2'];
            const userScore = userEloData?.new;
            const eloDelta = userEloData?.delta;

            let outcome: 'win' | 'loss' | 'draw' = 'draw';
            if (match.winnerId === user.id) {
                outcome = 'win';
            } else if (match.winnerId && match.winnerId !== user.id) {
                outcome = 'loss';
            }

            return {
                id: match.id,
                opponent,
                outcome,
                userEloAfter: userScore,
                eloDelta,
                questionCount: match.questionIds?.length || 0,
                endTime: match.endTime,
                duration: match.endTime && match.startTime
                    ? Math.floor((match.endTime.getTime() - match.startTime.getTime()) / 1000 / 60)
                    : null
            };
        }).filter(m => m !== null);

        return NextResponse.json({
            matches: formattedMatches,
            pagination: {
                limit,
                offset,
                total: totalCount
            }
        });
    } catch (error) {
        console.error("[API] /api/matches error:", error);
        const msg = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: msg, details: error }, { status: 500 });
    }
}
