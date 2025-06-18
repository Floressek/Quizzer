import { prisma } from "@/lib/db";
import Flashcard from "@/components/ui/Flashcard/Flashcard";
import { notFound } from "next/navigation";

export default async function LearnPage({ params }: { params: { quizId: string } }) {
    const game = await prisma.game.findUnique({
        where: { id: params.quizId },
        include: {
            questions: {
                select: {
                    id: true,
                    question: true,
                    answer: true
                }
            }
        }
    });

    if (!game) return notFound();

    return (
        <div className="flex flex-col items-center gap-6 py-12 px-4 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold">Flashcards: {game.topic}</h1>
            {game.questions.map((q) => (
                <Flashcard key={q.id} front={q.question} back={q.answer} />
            ))}
        </div>
    );
}
