import React from "react";
import {getAuthSession} from "@/lib/nextAuth";
import {redirect} from "next/navigation";
import { prisma } from "@/lib/db";
import { LucideLayoutDashboard } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

type Props = {
    params: Promise<{
        gameId: string;
    }>
}

export const metadata = {
    title: "Statistics | Quizzy",
    description: "Statistics Page",
}

const StatisticsPage = async ({params}: Props) => {
    const {gameId} = await params; // do not remove, this is some gimmicky next.js shit
    const session = await getAuthSession();
    if (!session?.user) {
        // User is not logged in
        redirect("/?error=auth_required");
    }
    const game = await prisma.game.findUnique({
        where: {id: gameId}
    });

    if (!game) {
        // Game not found
        redirect("/quiz?error=game_not_found");
    }

    return (
        <>
            <div className="p-8 mx-auto max-2-7xl">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Statistics</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard" className={buttonVariants()}>
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}

export default StatisticsPage;


