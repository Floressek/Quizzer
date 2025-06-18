import { getAuthSession } from "@/lib/nextAuth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(_: Request, context: { params: { id: string } }) {
    const { id } = context.params;
    const session = await getAuthSession();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const set = await prisma.flashcardSet.findUnique({
        where: { id },
        include: { cards: true },
    });

    if (!set || set.userId !== session.user.id) {
        return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }

    await prisma.flashcard.deleteMany({
        where: { setId: id },
    });

    await prisma.flashcardSet.delete({
        where: { id },
    });

    return NextResponse.json({ success: true });
}
