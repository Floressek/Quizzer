import { getAuthSession } from "@/lib/nextAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GameType } from "@prisma/client";

export async function POST(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { topic, type, text, questions } = body;

        if (typeof topic !== "string" || (type !== "open-ended" && type !== "multiple-choice")) {
            return NextResponse.json({ error: "Invalid input." }, { status: 400 });
        }

        let generatedQuestions: { question: string; answer: string; options?: string[] }[] = [];

        if (type === "open-ended") {
            if (typeof text !== "string") {
                return NextResponse.json({ error: "Missing or invalid text for open-ended quiz." }, { status: 400 });
            }

            const sentences = text.split(/[.?!]\s+/).filter(Boolean);

            for (const sentence of sentences) {
                const match = sentence.match(/^(.*?)\s+(to|jest)\s+(.*)$/i);
                if (match) {
                    const subject = match[1].trim();
                    const answer = match[3].trim();
                    generatedQuestions.push({
                        question: `Czym jest ${subject}?`,
                        answer,
                    });
                }
            }

            if (generatedQuestions.length === 0) {
                return NextResponse.json({ error: "No questions could be generated from the text." }, { status: 422 });
            }

        } else if (type === "multiple-choice") {
            if (!Array.isArray(questions) || questions.length === 0) {
                return NextResponse.json({ error: "Missing or invalid questions for multiple choice." }, { status: 422 });
            }
            generatedQuestions = questions;
        }

        const game = await prisma.game.create({
            data: {
                topic,
                gameType: type === "open-ended" ? GameType.open_ended : GameType.multiple_choice,
                timeStarted: new Date(),
                timeEnded: new Date(),
                userId: session.user.id,
            },
        });

        const formatted = generatedQuestions.map((q) => ({
            question: q.question,
            answer: q.answer,
            options: q.options ?? [],
            gameId: game.id,
            questionType: type === "open-ended" ? GameType.open_ended : GameType.multiple_choice,
        }));

        await prisma.question.createMany({ data: formatted });

        return NextResponse.json({ gameId: game.id }, { status: 200 });
    } catch (error) {
        console.error("Error in OCR quiz generation:", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
