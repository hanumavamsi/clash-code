import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

// PUT /api/friends/accept
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.name) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { friendshipId } = body;

        const user = await prisma.user.findUnique({ where: { username: session.user.name } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const friendship = await prisma.friendship.findUnique({
            where: { id: friendshipId }
        });

        if (!friendship || friendship.user2Id !== user.id) {
            return NextResponse.json({ error: "Not found or not authorized to accept" }, { status: 403 });
        }

        const accepted = await prisma.friendship.update({
            where: { id: friendshipId },
            data: { status: "ACCEPTED" }
        });

        return NextResponse.json(accepted);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
