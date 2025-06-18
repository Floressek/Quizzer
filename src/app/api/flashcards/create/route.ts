import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/nextAuth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getAuthSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, cards } = body;

    if (!title || !Array.isArray(cards) || cards.length === 0) {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const set = await prisma.flashcardSet.create({
        data: {
            title,
            userId: session.user.id,
            cards: {
                create: cards.map((c) => ({
                    front: c.front,
                    back: c.back,
                })),
            },
        },
        include: {
            cards: true,
        },
    });

    return NextResponse.json(set);
}
