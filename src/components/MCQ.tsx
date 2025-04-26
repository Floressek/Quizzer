"use client";
import React from "react";
import {Game, Question} from "@prisma/client";
import {ChevronRight, Timer} from "lucide-react";
import {Card, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import MCQCounter from "@/components/MCQCounter";
import {Separator} from "@/components/ui/separator";
import {useMutation} from "@tanstack/react-query";
import axios from "axios";
import {z} from "zod";
import {checkAnswerSchema} from "@/schemas/form/quiz";
import {toast} from "@/components/ui/sonner";

type Props = {
    game: Game & { questions: Pick<Question, 'id' | 'options' | 'question' | 'answer'>[] }
}

const MCQ = ({game}: Props) => {
    // Index for the current question
    const [questionIndex, setQuestionIndex] = React.useState(0);
    // Selected choice state
    const [selectedChoice, setSelectedChoice] = React.useState<number>(0);
    // Answer checking states
    const [correctAnswers, setCorrectAnswers] = React.useState(0);
    const [wrongAnswers, setWrongAnswers] = React.useState(0);

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

    // Handle the answer checking -> button
    const handleNextQuestion = React.useCallback(() => {
        checkAnswer(undefined, {
            onSuccess: ({isCorrect}) => {
                if (isCorrect) {
                    toast.success("Correct answer");
                    setCorrectAnswers((prev) => prev + 1);
                } else {
                    toast.error("Wrong answer");
                    setWrongAnswers((prev) => prev + 1);
                }
                setQuestionIndex((prev) => prev + 1);
            }
        });
    }, [checkAnswer]);

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
                        <span>00.00</span>
                    </div>
                </div>
                <MCQCounter correctAnswers={3} wrongAnswers={5}/>
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
                    onClick={() => {
                        handleNextQuestion();
                    }}
                >
                    Next <ChevronRight className="w-4 h-5 ml-2"/>
                </Button>
            </div>
        </div>
    )
}

export default MCQ;

