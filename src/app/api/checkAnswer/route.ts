import { checkAnswerSchema } from "@/schemas/form/quiz";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { compareTwoStrings } from "string-similarity";
import OpenAI from 'openai';
import { logger } from "@/lib/server-logger";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function calculateTextSimilarity(userAnswer: string, correctAnswer: string): Promise<number> {
    logger.info("=== SIMILARITY CHECK STARTED ===");

    try {
        // First log the inputs
        logger.info(`Input - User answer: "${userAnswer}"`);
        logger.info(`Input - Correct answer: "${correctAnswer}"`);

        // Basic validation
        if (!userAnswer || userAnswer.trim().length < 2) {
            logger.info("User answer too short, returning 0");
            return 0;
        }

        // First calculate string similarity score
        const userAnswerClean = userAnswer.toLowerCase().trim();
        const correctAnswerClean = correctAnswer.toLowerCase().trim();

        const stringSimilarity = compareTwoStrings(userAnswerClean, correctAnswerClean);
        const stringScore = Math.round(stringSimilarity * 100);

        logger.info(`Basic string comparison score: ${stringScore}%`);

        // For very low similarity, skip OpenAI
        if (stringSimilarity < 0.05) {
            logger.info("Very low similarity, skipping OpenAI check");
            return stringScore;
        }

        // Check if OpenAI key is available
        if (!process.env.OPENAI_API_KEY) {
            logger.error("OpenAI API key is missing in environment variables");
            return stringScore;
        }

        // Log OpenAI attempt
        logger.info("Attempting OpenAI semantic similarity check...");

        try {
            // Use OpenAI to calculate semantic similarity
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini", // Try a more reliable model instead of gpt-4o-mini
                messages: [
                    {
                        role: "system",
                        content: "You are an expert evaluating answer similarity. Your task is to assess how semantically similar a user's answer is to the correct answer. Return a single number from 0-100 representing similarity percentage. Return ONLY the number."
                    },
                    {
                        role: "user",
                        content: `Compare these two answers and rate their similarity from 0-100:
                        
                        CORRECT ANSWER: "${correctAnswer}"
                        USER ANSWER: "${userAnswer}"
                        
                        Similarity score (just the number):`
                    }
                ],
                temperature: 0.6,
                max_tokens: 5
            });

            // Log the raw response for debugging
            logger.info(`OpenAI raw response: ${JSON.stringify(response.choices)}`);

            const content = response.choices[0].message?.content?.trim() || "0";
            logger.info(`OpenAI processed content: "${content}"`);

            // Extract just the numbers from the response
            const numberMatch = content.match(/\d+/);
            let similarityScore: number;

            if (numberMatch) {
                similarityScore = parseInt(numberMatch[0], 10);
                logger.info(`Extracted number from response: ${similarityScore}`);
            } else {
                logger.warn(`Could not extract number from response: "${content}"`);
                similarityScore = stringScore; // Fallback to string similarity
            }

            // Validate the score
            if (isNaN(similarityScore) || similarityScore < 0 || similarityScore > 100) {
                logger.warn(`Invalid similarity score (${similarityScore}), using string similarity instead`);
                return stringScore;
            }

            logger.info(`Final OpenAI similarity score: ${similarityScore}%`);
            return similarityScore;

        } catch (openaiError) {
            // Print the full error details
            logger.error(`OpenAI API error: ${JSON.stringify(openaiError)}`);
            if (openaiError instanceof Error) {
                logger.error(`Error message: ${openaiError.message}`);
                logger.error(`Error stack: ${openaiError.stack}`);
            }

            // Fallback to string similarity
            logger.info(`Falling back to string similarity score: ${stringScore}%`);
            return stringScore;
        }
    } catch (error) {
        // Log complete error details
        logger.error(`Unexpected error in calculateTextSimilarity: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (error instanceof Error && error.stack) {
            logger.error(`Error stack: ${error.stack}`);
        }

        // Ultimate fallback - try one more time with just string comparison
        try {
            const fallbackScore = Math.round(compareTwoStrings(
                userAnswer.toLowerCase().trim(),
                correctAnswer.toLowerCase().trim()
            ) * 100);

            logger.info(`Emergency fallback similarity score: ${fallbackScore}%`);
            return fallbackScore;
        } catch {
            logger.error("Even string similarity failed, returning 0");
            return 0;
        }
    } finally {
        logger.info("=== SIMILARITY CHECK COMPLETED ===");
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { questionId, userAnswer } = checkAnswerSchema.parse(body);

        logger.info(`Processing answer for question ID: ${questionId}`);

        // Find the question
        const question = await prisma.question.findUnique({
            where: { id: questionId }
        });

        if (!question) {
            logger.warn(`Question not found: ${questionId}`);
            return NextResponse.json(
                { message: "Question not found" },
                { status: 404 }
            );
        }

        // Save the user's answer regardless of question type
        await prisma.question.update({
            where: { id: questionId },
            data: { userAnswer: userAnswer }
        });

        // Handle multiple choice questions
        if (question.questionType === 'multiple_choice') {
            const isCorrect = question.answer.toLowerCase().trim() === userAnswer.toLowerCase().trim();

            logger.info(`Multiple choice question - User answer: "${userAnswer}", Correct: ${isCorrect}`);

            await prisma.question.update({
                where: { id: questionId },
                data: { isCorrect }
            });

            return NextResponse.json(
                {
                    message: "Answer checked",
                    isCorrect
                },
                { status: 200 }
            );
        }
        // Handle open-ended questions
        else if (question.questionType === 'open_ended') {
            logger.info(`Open-ended question - Calculating similarity between answers`);

            const percentageSimilar = await calculateTextSimilarity(userAnswer, question.answer);

            logger.info(`Similarity result: ${percentageSimilar}%`);

            await prisma.question.update({
                where: { id: questionId },
                data: { percentageCorrect: percentageSimilar }
            });

            return NextResponse.json(
                { percentageSimilar },
                { status: 200 }
            );
        }
        // Handle unexpected question types
        else {
            logger.warn(`Unexpected question type: ${question.questionType}`);
            return NextResponse.json(
                {
                    message: `Answer recorded for question type: ${question.questionType}`,
                    isCorrect: null
                },
                { status: 200 }
            );
        }
    } catch (error) {
        logger.error(`Error in checkAnswer: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return NextResponse.json(
            {
                message: error instanceof Error ? error.message : "An unknown error occurred"
            },
            { status: 400 }
        );
    }
}