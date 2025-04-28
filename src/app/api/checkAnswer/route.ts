import {checkAnswerSchema} from "@/schemas/form/quiz";
import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";
// import {compareTwoStrings} from "string-similarity";
import OpenAI from 'openai';
import {compareTwoStrings} from "string-similarity";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


async function calculateTextSimilarity(userAnswer: string, correctAnswer: string): Promise<number> {
    // If the answer is too short or contains only a few characters, return 0
    // if (!userAnswer || userAnswer.trim().length < 3 || /^[a-z]{1,3}$/i.test(userAnswer)) {
    //     return 0;
    // }

    try {
        // Use string-similarity to calculate the similarity score
        const stringSimilarity = compareTwoStrings(
            userAnswer.toLowerCase().trim(),
            correctAnswer.toLowerCase().trim()
        );

        // Calculate the similarity score based on string comparison
        if (stringSimilarity < 0.1) {
            return Math.round(stringSimilarity * 100);
        }

        console.log("User answer: ", userAnswer);
        console.log("Correct answer: ", correctAnswer);

        // Use OpenAI to calculate the similarity score
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Jesteś ekspertem w ocenie podobieństwa tekstu. Oceń podobieństwo semantyczne między odpowiedzią użytkownika a prawidłową odpowiedzią. 
                    Zwróć liczbę od 0 do 100, gdzie:
                    - 0-20: Kompletnie niepoprawna, nie ma związku z prawidłową odpowiedzią
                    - 21-40: Minimalnie podobna, zawiera niektóre słowa kluczowe, ale w większości niepoprawna
                    - 41-60: Częściowo poprawna, rozumie podstawową koncepcję
                    - 61-80: Głównie poprawna, z drobnymi brakami lub nieścisłościami
                    - 81-100: W pełni poprawna, zawiera wszystkie kluczowe informacje
                    
                    Oceń tylko podobieństwo TREŚCI, ignoruj formatowanie, wielkość liter i interpunkcję.
                    Zwróć TYLKO liczbę, bez dodatkowego tekstu.`
                },
                {
                    role: "user",
                    content: `Prawidłowa odpowiedź: "${correctAnswer}"
                    Odpowiedź użytkownika: "${userAnswer}"
                    
                    Ocena podobieństwa (0-100):`
                }
            ],
            temperature: 0.8,
            max_tokens: 5
        });

        const similarityScore = parseInt(response.choices[0].message.content?.trim() || "0");
        console.log("Similarity score from OpenAI:", similarityScore);

        // Check if the similarity score is a valid number
        if (isNaN(similarityScore) || similarityScore < 0 || similarityScore > 100) {
            return Math.round(stringSimilarity * 100);
        }

        return similarityScore;
    } catch (error) {
        console.error("Error calculating similarity:", error);
        // Fallback to string-similarity if OpenAI fails
        return Math.round(compareTwoStrings(
            userAnswer.toLowerCase().trim(),
            correctAnswer.toLowerCase().trim()
        ) * 100);
    }
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
            const percentageSimilar = await calculateTextSimilarity(userAnswer, question.answer);


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