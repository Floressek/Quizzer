import { Question } from "@prisma/client";
import React from "react";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Props = {
    questions: Question[];
};

const QuestionList = ({ questions }: Props) => {
    if (!questions || questions.length === 0) {
        return <p className="text-muted-foreground mt-4">No questions to display.</p>;
    }

    const gameType = questions[0].questionType;

    return (
        <Table className="mt-4">
            <TableCaption>End of list.</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[10px]">No.</TableHead>
                    <TableHead>Question & Correct Answer</TableHead>
                    <TableHead>Your Answer</TableHead>
                    {gameType === "open_ended" && (
                        <TableHead className="w-[10px] text-right">Accuracy</TableHead>
                    )}
                </TableRow>
            </TableHeader>
            <TableBody>
                {questions.map((question, index) => (
                    <TableRow key={question.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                            {question.question}
                            <br />
                            <br />
                            <span className="font-semibold">{question.answer}</span>
                        </TableCell>

                        {gameType === "multiple_choice" && (
                            <TableCell
                                className={cn({
                                    "text-green-600": question.isCorrect,
                                    "text-red-600": !question.isCorrect
                                })}
                            >
                                {question.userAnswer ?? "Not answered"}
                            </TableCell>
                        )}

                        {gameType === "open_ended" && (
                            <>
                                <TableCell>{question.userAnswer}</TableCell>
                                <TableCell className="text-right">
                                    {question.percentageCorrect}%
                                </TableCell>
                            </>
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default QuestionList;
