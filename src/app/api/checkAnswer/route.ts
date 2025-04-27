import {checkAnswerSchema} from "@/schemas/form/quiz";
import {ZodError} from "zod";
import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {compareTwoStrings} from "string-similarity";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {questionId, userAnswer} = checkAnswerSchema.parse(body);
        const question = await prisma.question.findUnique({
            where: {
                id: questionId
            }
        });
        if (!question) {
            return NextResponse.json(
                "Question not found",
                {
                    status: 404
                }
            );
        }
        await prisma.question.update({
            where: {id: questionId},
            data: {
                userAnswer: userAnswer
            }
        })
        // Case for multiple choice questions
        if (question.questionType === 'multiple_choice') {
            const isCorrect = question.answer.toLowerCase().trim() === userAnswer.toLowerCase().trim();
            await prisma.question.update({
                where: {id: questionId},
                data: {
                    isCorrect
                }
            });
            return NextResponse.json(
                {
                    message: "Answer checked",
                    isCorrect
                },
                {
                    status: 200
                }
            );
        }
        // Case for open-ended questions
        else if (question.questionType === 'open_ended') {
            let percentageSimilar = compareTwoStrings(userAnswer.toLowerCase().trim(), question.answer.toLowerCase().trim());
            percentageSimilar = Math.round(percentageSimilar * 100);
            await prisma.question.update({
                where: {id: questionId},
                data: {
                    percentageCorrect: percentageSimilar
                }
            })
            return NextResponse.json(
                {
                    percentageSimilar,
                },
                {
                    status: 200
                }
            );
        }
        // Default case for other question types
        else {
            return NextResponse.json(
                {
                    message: `Answer recorded for question type: ${question.questionType}`,
                    isCorrect: null
                },
                {
                    status: 404
                }
            );
        }
    } catch (error) {
        return NextResponse.json(
            {
                message: error instanceof Error ? error.message : "An unknown error occurred"
            },
            {
                status: 400
            }
        );
    }
}