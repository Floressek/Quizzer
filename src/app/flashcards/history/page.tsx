import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/nextAuth";
import Link from "next/link";

export default async function FlashcardHistoryPage() {
    const session = await getAuthSession();
    if (!session?.user) return <div>Please log in</div>;

    const games = await prisma.game.findMany({
        where: {
            userId: session.user.id,
            timeEnded: {
                not: undefined
            }
        },
        orderBy: { timeEnded: "desc" },
        select: {
            id: true,
            topic: true,
            timeEnded: true
        }
    });

    return (
        <div className="w-full max-w-xl px-4 mx-auto py-12">
            <h1 className="w-full max-w-2xl px-4 mx-auto py-8">Your Quizzes</h1>
            <ul className="space-y-4">
                {games.map((game) => (
                    <li key={game.id}>
                        <Link
                            href={`/flashcards/learn/${game.id}`}
                            className="block p-4 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <div className="font-semibold">{game.topic}</div>
                            <div className="text-sm text-gray-500">
                                Done: {new Date(game.timeEnded!).toLocaleString()}
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
