import React from "react";
import {getAuthSession} from "@/lib/nextAuth";
import {redirect} from "next/navigation";
import QuizCreation from "@/components/QuizCreation";
import {prisma} from "@/lib/db";
import {buttonVariants} from "@/components/ui/button";
import Link from "next/link";
import { LucideLayoutDashboard } from "lucide-react";
import ResultsCard from "@/components/statistics/ResultsCard";
import AccuracyCard from "@/components/statistics/AccuracyCard";
import TimeTakenCard from "@/components/statistics/TimeTakenCard";
import QuestionList from "@/components/statistics/QuestionList";
import {GameType} from "@prisma/client";

type Props = {
    params: {
        gameId: string;
    };
}

export const metadata = {
    title: "Statistics | Quizzy",
    description: "Statistics Page",
}

const StatisticsPage = async (props : Props) => {
    const params = await props.params;
    const { gameId } = params;
    const session = await getAuthSession();
    if (!session?.user) {
        redirect("/?error=auth_required");
    }
    const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {questions: true}
    });
    if (!game) {
        redirect("/quiz");
    }

    let accuracy: number = 0;
    if (game.gameType === "mcq") {
        const totalCorrect = game.questions.reduce((acc, question) => {
            if (question.isCorrect) {
                return acc + 1;
        }
        return acc;
    }, 0);
        accuracy = (totalCorrect / game.questions.length) * 100;
    } else if (game.gameType === GameType.open_ended) {
        const totalPercentage = game.questions.reduce((acc, question) => {
            return acc + (question.percentageCorrect ?? 0)
        }, 0)

        accuracy = totalPercentage / game.questions.length
    }

    accuracy = Math.round(accuracy * 100) / 100;

    return (
        <>
            <div className="p-8 mx-auto max-w-7xl">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Statistics</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard" className={buttonVariants()}>
                            <LucideLayoutDashboard className="mr-2" />
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
                <div className="grid gap-4 mt-4 md:grid-cols-7">
                    <ResultsCard accuracy={accuracy} />
                    <AccuracyCard accuracy={accuracy} />
                    <TimeTakenCard timeEnded={new Date()} timeStarted={game.timeStarted} />
                </div>
                <QuestionList questions={game.questions} />
            </div>
        </>
    );
};

export default StatisticsPage;

