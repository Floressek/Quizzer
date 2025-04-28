import {checkAnswerSchema} from "@/schemas/form/quiz";
import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";
// import {compareTwoStrings} from "string-similarity";
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


async function calculateVectorSimilarity(text1: string, text2: string): Promise<number> {
    const response1 = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text1.toLowerCase().trim(),
    });

    const response2 = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text2.toLowerCase().trim(),
    });

    const embedding1 = response1.data[0].embedding;
    const embedding2 = response2.data[0].embedding;

    // Cosine similarity calculation
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        norm1 += Math.pow(embedding1[i], 2);
        norm2 += Math.pow(embedding2[i], 2);
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}


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
        // // Case for open-ended questions
        // else if (question.questionType === 'open_ended') {
        //     let percentageSimilar = compareTwoStrings(userAnswer.toLowerCase().trim(), question.answer.toLowerCase().trim());
        //     percentageSimilar = Math.round(percentageSimilar * 100);
        //     await prisma.question.update({
        //         where: {id: questionId},
        //         data: {
        //             percentageCorrect: percentageSimilar
        //         }
        //     })
        //     return NextResponse.json(
        //         {
        //             percentageSimilar,
        //         },
        //         {
        //             status: 200
        //         }
        //     );
        // }
        else if (question.questionType === 'open_ended') {
            const similarity = await calculateVectorSimilarity(userAnswer, question.answer);
            const percentageSimilar = Math.round(similarity * 100);

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