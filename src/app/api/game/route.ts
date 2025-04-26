import {getAuthSession} from "@/lib/nextAuth";
import {NextResponse} from "next/server";
import {quizCreationSchema} from "@/schemas/form/quiz";
import axios from "axios";
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
                timeEnded: new Date(),
                userId: session.user.id,
                topic
            }
        })

        const {data} = await axios.post(`${process.env.API_URL}/api/questions`, {
            amount,
            topic,
            type
        });
        // Different format for answer proj had answer as a standalone option we have it doubled
        if (type == 'multiple-choice') {
            type mcqQuestion = {
                question: string;
                answer: string;
                option1: string;
                option2: string;
                option3: string;
                option4: string;
            }
            const manyData = data.question.map((question: mcqQuestion) => {
                let options = [question.answer, question.option1, question.option2, question.option3, question.option4]
                options = options.sort(() => Math.random() - 0.5)
                return {
                    question: question.question,
                    answer: question.answer,
                    options: JSON.stringify(options),
                    gameId: game.id,
                    questionType: 'multiple-choice'
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
            const manyData = data.question.map((question: openQuestion) => {
                return {
                    question: question.question,
                    answer: question.answer,
                    gameId: game.id,
                    questionType: 'open-ended'
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