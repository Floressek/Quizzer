import {getAuthSession} from "@/lib/nextAuth";
import {NextResponse} from "next/server";
import {quizCreationSchema} from "@/schemas/form/quiz";
import axios from "axios";
import {ZodError} from "zod";
import {prisma} from "@/lib/db";
import {GameType} from "@prisma/client";
import {cookies} from "next/headers";

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
            gameType = GameType.mutiple_choice // Literówka w schemacie Prisma
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

        // Downloading cookies from the request
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('next-auth.session-token')?.value ||
            cookieStore.get('__Secure-next-auth.session-token')?.value;


        const {data} = await axios.post(`${process.env.API_URL}/api/questions`, {
            amount,
            topic,
            type
        }, {
            headers: {
                Cookie: `next-auth.session-token=${sessionCookie || ''}`
            }
        });
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

                // Check if the answer is already in the options - not plausible, but it's still undeterministic elements
                if (!answerExists) {
                    options.push(question.answer)
                }
                options = options.sort(() => Math.random() - 0.5)
                return {
                    question: question.question,
                    answer: question.answer,
                    options: options,
                    // Prisma handles JavaScript arrays to JSON,
                    // if different db, make sure to check if it saves correctly
                    gameId: game.id,
                    questionType: GameType.mutiple_choice
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
            error: "SomethingWentWrong"
        }, {status: 500})
    }
}