import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function ChallengePage(props: { params: Promise<{ token: string }> }) {
    const params = await props.params;
    const { token } = params;

    const session = await getServerSession();
    if (!session?.user?.name) {
        redirect("/api/auth/signin?callbackUrl=/challenge/" + token);
    }

    // A challenge token can simply map to a room directly for now.
    // In a full implementation, you'd map the token to a specific friendship 
    // or validate the token against Redis. Here we bridge them into a private room.
    const roomId = `challenge_${token}`;
    redirect(`/room/${roomId}`);
}
