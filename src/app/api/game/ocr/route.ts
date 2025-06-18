import { getAuthSession } from "@/lib/nextAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GameType } from "@prisma/client";
import { ZodError } from "zod";

export async function POST(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json(
                { error: "You must be logged in to access this resource." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { topic, type, questions } = body;

        if (
            !Array.isArray(questions) ||
            typeof topic !== "string" ||
            (type !== "open-ended" && type !== "multiple-choice")
        ) {
            return NextResponse.json({ error: "Invalid input." }, { status: 400 });
        }

        const game = await prisma.game.create({
            data: {
                topic,
                gameType: type === "open-ended" ? GameType.open_ended : GameType.multiple_choice,
                timeStarted: new Date(),
                timeEnded: new Date(), // można zaktualizować później
                userId: session.user.id,
            },
        });

        const formatted = questions.map((q: { question: string; answer: string; options?: string[] }) => ({
            question: q.question,
            answer: q.answer,
            options: q.options ?? [],
            gameId: game.id,
            questionType: type === "open-ended" ? GameType.open_ended : GameType.multiple_choice,
        }));

        await prisma.question.createMany({
            data: formatted,
        });

        return NextResponse.json({ gameId: game.id }, { status: 200 });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Error in POST /api/game/ocr", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
