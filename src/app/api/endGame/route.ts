import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {z} from "zod";
import {getAuthSession} from "@/lib/nextAuth";

const endGameSchema = z.object({
    gameId: z.string(),
    timeEnded: z.coerce.date().optional()
});

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
        const {gameId, timeEnded} = endGameSchema.parse(body);

        const game = await prisma.game.findUnique({
            where: {
                id: gameId,
            },
        });

        if (!game) {
            return NextResponse.json(
                {
                    message: "Game not found",
                },
                {
                    status: 404,
                }
            );
        }

        // Check if the user is the owner of the game
        if (game.userId !== session.user.id) {
            return NextResponse.json(
                {
                    message: "You are not authorized to end this game",
                },
                {
                    status: 403,
                });
        }

        const updateGame = await prisma.game.update({
            where: {
                id: gameId,
            },
            data: {
                timeEnded: timeEnded,
            },
        });
        return NextResponse.json(
            {
                message: "Game ended successfully",
                game: {
                    id: updateGame.id,
                    timeStarted: updateGame.timeStarted,
                    timeEnded: updateGame.timeEnded,
                }
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues },
                { status: 400 }
            );
        }

        console.error("Error in POST /api/endGame", error);
        return NextResponse.json(
            {
                message: error instanceof Error ? error.message : "An unknown error occurred",
            },
            { status: 500 }
        );
    }

}