"use client"
import React from "react";
import {Game, Question} from "@prisma/client";
import {BarChart, ChevronRight, Loader2, Timer} from "lucide-react";
import {cn, formatTimeDelta} from "@/lib/utils";
import {differenceInSeconds} from "date-fns";
import {Card, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {Button, buttonVariants} from "@/components/ui/button";
import axios from "axios";
import {useMutation} from "@tanstack/react-query";
import {z} from "zod";
import {checkAnswerSchema} from "@/schemas/form/quiz";
import {toast} from "@/components/ui/sonner";
import Link from "next/link";
import BlankAnswerInput from "@/components/BlankAnswerInput";

type Props = {
    game: Game & { questions: Pick<Question, "id" | "question" | "answer">[] }
}

const OpenEnded = ({game}: Props) => {
    // Index for the current question
    const [questionIndex, setQuestionIndex] = React.useState(0);
    const [blankAnswer, setBlankAnswer] = React.useState<string>("");
    const [fullUserAnswer, setFullUserAnswer] = React.useState<string>("");
    // Answer checking states
    const [hasEnded, setHasEnded] = React.useState<boolean>(false);
    const [now, setNow] = React.useState<Date>(new Date());
    const [quizStartTime, setQuizStartTime] = React.useState<Date>(new Date());

    // Time tracking
    React.useEffect(() => {
        // Set the quiz start time to the current time
        setQuizStartTime(new Date());
        const interval = setInterval(() => {
            if (!hasEnded) {
                setNow(new Date());
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [hasEnded]);

    // Current question with memoization
    const currentQuestion = React.useMemo(() => {
        return game.questions[questionIndex]
    }, [questionIndex, game.questions]);

    // Checking the answer - POST request
    const {mutate: checkAnswer, isPending: isChecking} = useMutation({
        mutationFn: async () => {
            console.log("Submitting user answer:", blankAnswer);
            console.log("Full user answer:", fullUserAnswer);


            // Check if the data is valid based on the answer schema
            const payload: z.infer<typeof checkAnswerSchema> = {
                questionId: currentQuestion.id,
                userAnswer: blankAnswer, // Use the collected blank answer
                fullUserAnswer: fullUserAnswer // Use the full user answer
            };

            const response = await axios.post('/api/checkAnswer', payload);
            return response.data;
        }
    });

    // End time for our game
    const {mutate: endGame} = useMutation({
        mutationFn: async () => {
            const payload = {
                gameId: game.id,
                timeEnded: new Date()
            };
            const response = await axios.post('/api/endGame', payload);
            return response.data;
        }
    });

    const handleNextQuestion = React.useCallback(() => {
        if (isChecking) {
            return;
        }

        console.log("Przesyłana odpowiedź:", blankAnswer);

        // Sprawdź, czy odpowiedź nie jest pusta
        if (!blankAnswer || blankAnswer.trim() === '') {
            toast.warning("All inputs are blanks, are you sure?");
            return;
        }

        checkAnswer(undefined, {
            onSuccess: ({percentageSimilar}) => {
                toast.info(`Twoja odpowiedź jest podobna do poprawnej w ${percentageSimilar}%!`);

                // Wyczyść odpowiedź przed następnym pytaniem
                setBlankAnswer("");

                if (questionIndex === game.questions.length - 1) {
                    endGame();
                    setHasEnded(true);
                    return;
                }
                setQuestionIndex((prev) => prev + 1);
            },
            onError: (error) => {
                console.error("Błąd sprawdzania odpowiedzi:", error);
                toast.error("Nie udało się sprawdzić twojej odpowiedzi. Spróbuj ponownie.");
            }
        });
    }, [checkAnswer, blankAnswer, game.questions.length, isChecking, questionIndex, endGame]);

    // Handle keyboard events
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                handleNextQuestion();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleNextQuestion]);

    // End game UI
    if (hasEnded) {
        return (
            <div className="absolute flex flex-col justify-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="px-4 mt-2 font-semibold text-white bg-green-500 rounded-md whitespace-nowrap">
                    You completed the quiz in {formatTimeDelta(differenceInSeconds(now, game.timeStarted))}!
                </div>
                <Link
                    href={`/statistics/${game.id}`}
                    className={cn(buttonVariants({size: "lg"}), "mt-2")}
                >
                    View Statistics
                    <BarChart className="w-4 h-4 ml-2"/>
                </Link>
                <Link
                    href={`/flashcards/learn/${game.id}`}
                    className={cn(buttonVariants({ size: "lg" }), "mt-2")}
                >
                    Review as Flashcards
                </Link>

            </div>
        )
    }

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:w-[80vw] max-w-4xl w-[90vw]">
            <div className="flex flex-row justify-between">
                <div className="flex flex-col">
                    {/*topic*/}
                    <p>
                        <span className="mr-2 text-slate-400">Topic</span>
                        <span className="px-2 py-1 text-white rounded-lg bg-slate-800">{game.topic}</span>
                    </p>
                    <div className="flex self-start mt-3 text-slate-400">
                        <Timer className="mr-2"/>
                        {formatTimeDelta(differenceInSeconds(now, quizStartTime))}
                    </div>
                </div>
            </div>

            <Card className="w-full mt-4">
                <CardHeader className="flex flex-row items-center">
                    <CardTitle className="mr-5 text-center divide-zinc-750/50">
                        <div className="mb-1">{questionIndex + 1}</div>
                        <Separator orientation="horizontal" className="bg-slate-400 dark:bg-slate-600 h-[1px] w-full"/>
                        <div className="text-base text-slate-400">
                            {game.questions.length}
                        </div>
                    </CardTitle>
                    <CardDescription className="flex-grow text-lg">
                        {currentQuestion.question}
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="flex flex-col items-center justify-center w-full mt-4">
                <BlankAnswerInput
                    answer={currentQuestion.answer}
                    setBlankAnswer={setBlankAnswer}
                    setFullUserAnswer={setFullUserAnswer}
                />

                <Button
                    className="mt-4"
                    disabled={isChecking}
                    onClick={handleNextQuestion}
                >
                    {isChecking && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                    Next <ChevronRight className="w-4 h-5 ml-2"/>
                </Button>
            </div>
        </div>
    )
}

export default OpenEnded;