"use client";
import React from "react";
import {Game, Question} from "@prisma/client";
import {BarChart, ChevronRight, Loader2, Timer} from "lucide-react";
import {Card, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button, buttonVariants} from "@/components/ui/button";
import MCQCounter from "@/components/MCQCounter";
import {Separator} from "@/components/ui/separator";
import {useMutation} from "@tanstack/react-query";
import axios from "axios";
import {z} from "zod";
import {checkAnswerSchema} from "@/schemas/form/quiz";
import {toast} from "@/components/ui/sonner";
import Link from "next/link";
import {cn, formatTimeDelta} from "@/lib/utils";
import {differenceInSeconds} from "date-fns";

type Props = {
    game: Game & { questions: Pick<Question, 'id' | 'options' | 'question' | 'answer'>[] }
}

const MCQ = ({game}: Props) => {
    // Index for the current question
    const [questionIndex, setQuestionIndex] = React.useState(0);
    // Selected choice state
    const [selectedChoice, setSelectedChoice] = React.useState<number>(0);
    // Answer checking states
    const [correctAnswers, setCorrectAnswers] = React.useState<number>(0);
    const [wrongAnswers, setWrongAnswers] = React.useState<number>(0);
    const [hasEnded, setHasEnded] = React.useState<boolean>(false);
    const [now, setNow] = React.useState<Date>(new Date());

    // Time
    React.useEffect(() => {
        const interval = setInterval(() => {
            if(!hasEnded) {
            setNow(new Date());
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [hasEnded]);

    // We are using memoization to avoid unnecessary re-renders and to optimize performance ;)
    const currentQuestion = React.useMemo(() => {
        return game.questions[questionIndex]
    }, [questionIndex, game.questions]); // once we change the questionIndex we will re-render the component

    // Checking the answer - POST request
    const {mutate: checkAnswer, isPending: isChecking} = useMutation({
        mutationFn: async () => {
            // Check if the data is valid based on the answer schema
            const payload: z.infer<typeof checkAnswerSchema> = {
                questionId: currentQuestion.id,
                userAnswer: options[selectedChoice]
            };
            const response = await axios.post('/api/checkAnswer', payload);
            return response.data;
        }
    });

    // Handle the answer checking -> button, to disallow spamming the render include HERE
    const handleNextQuestion = React.useCallback(() => {
        if (isChecking) {
            return;
        }
        checkAnswer(undefined, {
            onSuccess: ({isCorrect}) => {
                if (isCorrect) {
                    toast.success("Correct answer");
                    setCorrectAnswers((prev) => prev + 1);
                } else {
                    toast.error("Wrong answer");
                    setWrongAnswers((prev) => prev + 1);
                }
                if (questionIndex === game.questions.length - 1) {
                    setHasEnded(true);
                    toast.info("Quiz ended");
                    return;
                }
                setQuestionIndex((prev) => prev + 1);
            }
        });
    }, [checkAnswer, game.questions.length, isChecking, questionIndex]);

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === '1') {
                setSelectedChoice(0);
            } else if (event.key === '2') {
                setSelectedChoice(1);
            } else if (event.key === '3') {
                setSelectedChoice(2);
            } else if (event.key === '4') {
                setSelectedChoice(3);
            } else if (event.key === 'Enter') {
                handleNextQuestion();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Cleanup function to remove the event listener
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    });


    const options = React.useMemo(() => {
        if (!currentQuestion) {
            return [];
        }
        if (!currentQuestion.options) {
            return [];
        }
        // return JSON.parse(currentQuestion.options as string) as string[];
        return currentQuestion.options as string[];
    }, [currentQuestion]); // once we change the currentQuestion we will re-render the component

    if (hasEnded) {
        return (
            <div className="absolute flex flex-col justify-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="px-4 mt-2 font-semibold text-white bg-green-500 rounded-md whitespace-nowrap">
                    You completed the quiz in {formatTimeDelta(differenceInSeconds(now, game.timeStarted))}!
                </div>
                <Link
                    href={`/statistics/${game.id}`}
                    className={cn(buttonVariants({ size: "lg" }), "mt-2")}
                >
                    View Statistics
                    <BarChart className="w-4 h-4 ml-2" />
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
                        {/*For testing purposes hardcoded to 00:00 FIXME*/}
                        {formatTimeDelta(differenceInSeconds(now, game.timeStarted))}
                    </div>
                </div>
                <MCQCounter
                    correctAnswers={correctAnswers}
                    wrongAnswers={wrongAnswers}
                />
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
                {options.map((option, index) => {
                    return (
                        <Button key={index}
                                className="justify-start w-full py-8 mb-4"
                                variant={selectedChoice === index ? "default" : "secondary"}
                                onClick={() => {
                                    setSelectedChoice(index);
                                }}>
                            <div className="flex items-center justify-start">
                                <div
                                    className="p-2 px-3 mr-5 border rounded-md bg-gray-100 dark:text-slate-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-slate-800">
                                    {index + 1}
                                </div>
                                <div className="text-start">{option}</div>
                            </div>
                        </Button>
                    )
                })}
                <Button
                    className="mt-2"
                    disabled={isChecking}
                    onClick={() => {
                        handleNextQuestion();
                    }}
                >
                    {isChecking && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                    Next <ChevronRight className="w-4 h-5 ml-2"/>
                </Button>
            </div>
        </div>
    )
}

export default MCQ;

