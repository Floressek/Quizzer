import {getAuthSession} from "@/lib/nextAuth";
import {NextResponse} from "next/server";
import {quizCreationSchema} from "@/schemas/form/quiz";
import {ZodError} from "zod";
import {prisma} from "@/lib/db";
import {GameType} from "@prisma/client";

export async function POST(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return new NextResponse(
                "You must be logged to access this resource.",
                {
                    status: 401
                }
            );
        }
        const body = await request.json();
        const {amount, topic, type} = quizCreationSchema.parse(body);

        // Error with types
        let gameType: GameType;
        if (type === 'multiple-choice') {
            gameType = GameType.multiple_choice
        } else if (type === 'open-ended') {
            gameType = GameType.open_ended
        } else {
            return NextResponse.json({
                error: "Invalid type"
            }, {status: 400})
        }

        const game = await prisma.game.create({
            data: {
                gameType: gameType,
                timeStarted: new Date(),
                timeEnded: new Date(), // to be updated later by the game logic
                userId: session.user.id,
                topic
            }
        })

        // Get the base URL from the current request
        const apiUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL ||
            process.env.RAILWAY_STATIC_URL || 'http://localhost:3000';

        console.log(`Making request to: ${apiUrl}/api/questions`);


        // Use fetch with all cookies from the original request
        const response = await fetch(`${apiUrl}/api/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Forward all cookies including auth
                'Cookie': request.headers.get('cookie') || '',
            },
            body: JSON.stringify({
                amount,
                topic,
                type
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API request failed with status ${response.status}: ${errorText}`);
            throw new Error(`Failed to fetch questions: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log(`Successfully received questions: ${data.questions.length}`);

        // Different format for answer proj had answer as a standalone option we have it doubled
        if (type == 'multiple-choice') {
            type mcqQuestion = {
                question: string;
                answer: string;
                options: string[];
            }
            const manyData = data.questions.map((question: mcqQuestion) => {
                let options = [...question.options]
                const answerExists = options.includes(question.answer)

                // Check if the answer is already in the options
                if (!answerExists) {
                    options.push(question.answer)
                }
                options = options.sort(() => Math.random() - 0.5)
                return {
                    question: question.question,
                    answer: question.answer,
                    options: options,
                    gameId: game.id,
                    questionType: GameType.multiple_choice
                }
            })

            await prisma.question.createMany({
                data: manyData
            })
        } else if (type == 'open-ended') {
            type openQuestion = {
                question: string;
                answer: string;
            }
            const manyData = data.questions.map((question: openQuestion) => {
                return {
                    question: question.question,
                    answer: question.answer,
                    gameId: game.id,
                    questionType: GameType.open_ended
                }
            })

            await prisma.question.createMany({
                data: manyData
            })
        }

        return NextResponse.json({
            gameId: game.id,
        }, {
            status: 200
        })
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                {error: error.issues},
                {status: 400}
            )
        }

        console.error("Error in POST /api/game", error);

        return NextResponse.json({
            error: "SomethingWentWrong",
            message: error instanceof Error ? error.message : String(error)
        }, {status: 500})
    }
}