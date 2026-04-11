import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

// POST /api/friends
// Send a friend request
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.name) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { targetUsername } = body;

        const sender = await prisma.user.findUnique({ where: { username: session.user.name } });
        const receiver = await prisma.user.findUnique({ where: { username: targetUsername } });

        if (!sender || !receiver) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (sender.id === receiver.id) {
            return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });
        }

        // Check if exists
        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { user1Id: sender.id, user2Id: receiver.id },
                    { user1Id: receiver.id, user2Id: sender.id }
                ]
            }
        });

        if (existing) {
            return NextResponse.json({ error: "Friendship already exists or pending" }, { status: 400 });
        }

        const friendship = await prisma.friendship.create({
            data: {
                user1Id: sender.id,
                user2Id: receiver.id,
                status: "PENDING"
            }
        });

        return NextResponse.json(friendship);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
