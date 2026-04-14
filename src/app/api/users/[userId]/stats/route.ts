import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/users/[userId]/stats
// Get user statistics (public endpoint)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const userId = (await params).userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                image: true,
                eloRating: true,
                matchCount: true,
                createdAt: true,
                matchesAsP1: { select: { id: true, winnerId: true } },
                matchesAsP2: { select: { id: true, winnerId: true } }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Calculate stats
        const allMatches = [...user.matchesAsP1, ...user.matchesAsP2];
        const wins = allMatches.filter(m => m.winnerId === userId).length;
        const losses = allMatches.filter(m => m.winnerId && m.winnerId !== userId).length;
        const draws = allMatches.length - wins - losses;
        const winRate = allMatches.length > 0 ? (wins / allMatches.length * 100).toFixed(1) : "0.0";

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                image: user.image,
                eloRating: user.eloRating,
                createdAt: user.createdAt
            },
            stats: {
                totalMatches: allMatches.length,
                wins,
                losses,
                draws,
                winRate: parseFloat(winRate)
            }
        });
    } catch (error) {
        console.error("[API] /api/users/[userId]/stats error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
