import { prisma } from "@/lib/db";
import Flashcard from "@/components/ui/Flashcard/Flashcard";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function FlashcardSetPage({ params }: { params: { id: string } }) {
    const { id } = params;

    const set = await prisma.flashcardSet.findUnique({
        where: { id },
        include: { cards: true },
    });


    if (!set) return notFound();

    return (
        <div className="flex flex-col items-center gap-6 py-12 px-4 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold">Flashcards: {set.title}</h1>

            {set.cards.map((card) => (
                <Flashcard key={card.id} front={card.front} back={card.back} />
            ))}

            <Link
                href="/flashcards"
                className="text-sm text-blue-400 hover:underline text-center mt-4"
            >
                ← Back to Flashcards
            </Link>
        </div>
    );
}
