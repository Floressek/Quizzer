import React from "react";
import {getAuthSession} from "@/lib/nextAuth";
import {redirect} from "next/navigation";
import QuizCreation from "@/components/QuizCreation";
import {prisma} from "@/lib/db";
import MCQ from "@/components/MCQ";

type Props = {
    params: Promise<{
        gameId: string;
    }>
}

export const metadata = {
    title: "Game | Quizzy",
    description: "Game Page  - multiple choice",
}

const MultipleChoicePage = async ({params}: Props) => {
    const {gameId} = await params;
    const session = await getAuthSession();
    if (!session?.user) {
        // User is not logged in
        redirect("/?error=auth_required");
    }
    const game = await prisma.game.findUnique({
        where: {
            id: gameId
        }, include: {
            questions: {
                select: {
                    id: true,
                    question: true,
                    answer: true,
                    options: true
                }
            }
        }
    });
    if (!game) {
        // Game not found
        redirect("/quiz?error=game_not_found");
    }
    // return (
    //     <pre>{JSON.stringify(game, null, 2)}</pre>
    // )
    return <MCQ game={game}/>
}

export default MultipleChoicePage;

