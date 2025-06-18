import { getAuthSession } from "@/lib/nextAuth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getAuthSession();
    if (!session?.user) return NextResponse.json([], { status: 401 });

    const sets = await prisma.flashcardSet.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: { cards: true },
    });

    return NextResponse.json(sets);
}
