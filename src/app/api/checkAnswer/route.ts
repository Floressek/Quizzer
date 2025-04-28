import {checkAnswerSchema} from "@/schemas/form/quiz";
import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {compareTwoStrings} from "string-similarity";
import OpenAI from 'openai';
import {logger} from "@/lib/server-logger";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Extract keywords from the correct answer (the words with $ prefix)
function extractKeywords(answer: string): string[] {
    const keywordsWithDollar = answer.match(/\$\w+(-\w+)*/g) || [];
    return keywordsWithDollar.map(word => word.substring(1)); // Remove $ sign
}

async function checkKeywordSimilarity(
    userWords: string[],
    correctKeywords: string[],
    fullCorrectAnswer?: string,
    fullUserAnswer?: string
): Promise<number> {
    logger.debug("=== CHECKING KEYWORD SIMILARITY ===");
    logger.debug(`User words: ${userWords.join(', ')}`);
    logger.debug(`Correct keywords: ${correctKeywords.join(', ')}`);

    if (fullCorrectAnswer) {
        logger.debug(`Full answer context available (${fullCorrectAnswer.length} chars)`);
    }

    if (fullUserAnswer) {
        logger.debug(`Full user answer available (${fullUserAnswer.length} chars)`);
    }


    // If the number of words doesn't match, we'll just compare what we have
    if (userWords.length !== correctKeywords.length) {
        logger.warn(`Word count mismatch: user ${userWords.length}, expected ${correctKeywords.length}`);
    }

    try {
        // Use OpenAI to check semantic similarity
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a quiz grading assistant.

                        Compare the user's answers with the correct ones based on two levels:
                        
                        1. **Word-by-word evaluation**:  
                        Compare each user word directly to the corresponding correct keyword.  
                        Rate how semantically similar they are, on a scale from 0 to 100.
                        
                        2. **Full sentence evaluation**:  
                        Evaluate how the user's full answer (with inserted words) compares to the correct full answer in meaning and correctness.  
                        Rate this separately from 0 to 100.
                        
                        Finally, **average the word-level score** and the **sentence-level score** together into a final result (simple average).
                        
                        Be strict but fair:
                        - Minor differences like "blue" vs "light blue" = high similarity (90–97%)
                        - Synonyms like "choices" vs "decisions" = medium-high similarity (80–90%)
                        - Completely different meanings = low similarity (10–30%)
                        
                        **Return ONLY a single number (the final average similarity score from 0–100). No explanations, no text.**`
                },
                {
                    role: "user",
                    content: `User's answers: ${userWords.join(', ')}
                    Correct answers: ${correctKeywords.join(', ')}
                    Full correct answer: ${fullCorrectAnswer || "N/A"}
                    Full user answer: ${fullUserAnswer || "N/A"}
                    
                    Give a similarity score from 0-100 as a single number:`
                }
            ],
            temperature: 0.7,
            max_tokens: 10
        });

        const content = response.choices[0].message?.content?.trim() || "0";
        logger.debug(`OpenAI response: ${content}`);

        // Extract number from response
        const numberMatch = content.match(/\d+/);
        if (numberMatch) {
            const score = parseInt(numberMatch[0], 10);
            logger.debug(`Final similarity score: ${score}%`);
            return score;
        }

        // Fallback to basic string comparison if OpenAI doesn't return a number
        logger.warn("Couldn't extract score from OpenAI response, using fallback");
        return calculateFallbackScore(userWords, correctKeywords);

    } catch (error) {
        logger.error(`Error with OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return calculateFallbackScore(userWords, correctKeywords);
    }
}

// Basic string comparison as fallback
function calculateFallbackScore(userWords: string[], correctKeywords: string[]): number {
    logger.debug("Using fallback string comparison");

    const minLength = Math.min(userWords.length, correctKeywords.length);
    let totalSimilarity = 0;

    for (let i = 0; i < minLength; i++) {
        const similarity = compareTwoStrings(
            userWords[i].toLowerCase().trim(),
            correctKeywords[i].toLowerCase().trim()
        );
        totalSimilarity += similarity;
    }

    const score = Math.round((totalSimilarity / minLength) * 100);
    logger.debug(`Fallback similarity score: ${score}%`);
    return score;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {questionId, userAnswer, fullUserAnswer} = checkAnswerSchema.parse(body);

        logger.debug(`Processing answer for question ID: ${questionId}`);

        // Find the question
        const question = await prisma.question.findUnique({
            where: {id: questionId}
        });

        if (!question) {
            return NextResponse.json(
                {message: "Question not found"},
                {status: 404}
            );
        }

        // Save user's answer
        await prisma.question.update({
            where: {id: questionId},
            data: {userAnswer}
        });

        // Handle multiple choice questions
        if (question.questionType === 'multiple_choice') {
            const isCorrect = question.answer.toLowerCase().trim() === userAnswer.toLowerCase().trim();

            await prisma.question.update({
                where: {id: questionId},
                data: {isCorrect}
            });

            return NextResponse.json({isCorrect}, {status: 200});
        }
        // Handle open-ended questions
        else if (question.questionType === 'open_ended') {
            logger.debug(`Open-ended question - Calculating similarity between answers`);

            // Extract original keywords from the question
            const correctKeywords = extractKeywords(question.answer);
            logger.debug(`Correct keywords: ${correctKeywords.join(', ')}`);

            const fullCorrectAnswer = question.answer.replace(/\$/g, '');

            if (fullUserAnswer) {
                logger.debug(`Full user answer: "${fullUserAnswer}"`);
            }

            if (fullCorrectAnswer) {
                logger.debug(`Full correct answer: "${fullCorrectAnswer}"`);
            }

            // Extract user's keywords (marked with $)
            const userKeywordsRegex = /\$([\w\s-]+?)\$/g;
            let match;
            const userWords = [];

            // Find all $keyword$ patterns
            while ((match = userKeywordsRegex.exec(userAnswer)) !== null) {
                userWords.push(match[1]); // Add the word without $ markers
            }

            logger.debug(`Extracted user keywords: ${userWords.join(', ')}`);

            // If no keywords were found with $ markers, try splitting by spaces
            if (userWords.length === 0) {
                logger.debug("No $ markers found, trying to split by spaces");
                const fallbackWords = userAnswer.split(/\s+/).filter(word =>
                    word.trim() !== '' &&
                    word.trim() !== '[blank]'
                );

                if (fallbackWords.length > 0) {
                    logger.debug(`Using space-separated words: ${fallbackWords.join(', ')}`);
                    // Calculate similarity using the fallback words
                    const percentageSimilar = await checkKeywordSimilarity(
                        fallbackWords, correctKeywords, fullCorrectAnswer, fullUserAnswer || "");

                    await prisma.question.update({
                        where: {id: questionId},
                        data: {percentageCorrect: percentageSimilar}
                    });

                    return NextResponse.json({percentageSimilar}, {status: 200});
                }

                logger.warn("No valid user input found");
                return NextResponse.json({percentageSimilar: 0}, {status: 200});
            }

            // Calculate similarity between the keywords
            const percentageSimilar = await checkKeywordSimilarity(userWords, correctKeywords, fullCorrectAnswer,
                fullUserAnswer || ""
            );

            logger.debug(`Similarity result: ${percentageSimilar}%`);

            // Update the question
            await prisma.question.update({
                where: {id: questionId},
                data: {percentageCorrect: percentageSimilar}
            });

            return NextResponse.json({percentageSimilar}, {status: 200});
        } else {
            return NextResponse.json(
                {message: "Unsupported question type"},
                {status: 400}
            );
        }
    } catch (error) {
        logger.error(`Error in checkAnswer: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return NextResponse.json(
            {message: error instanceof Error ? error.message : "An unknown error occurred"},
            {status: 400}
        );
    }
}