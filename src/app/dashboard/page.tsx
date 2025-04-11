import React from 'react';
import {redirect} from "next/navigation";
import {getAuthSession} from "@/lib/nextAuth";
import {prisma} from "@/lib/db";
import QuizMeCard from "@/components/dashboard/QuizMeCard";
import HistoryCard from "@/components/dashboard/HistoryCard";

type Props = {};

export const metadata = {
    title: "Dashboard | Quizzy",
    description: "Dashboard page",
}

const Dashboard = async (props: Props) => {
    const session = await getAuthSession();
    if (!session?.user) {
        // User is not logged in
        redirect("/?error=auth_required");
    }
    return (
        <main className="p-8 mx-auto max-w-7x1">
            <div className="flex items-center">
                <h2 className="mr-2 text-3x1 font-bold tracking-tight">Dashboard</h2>
            </div>
            <div className="grid gap-4 mt-4 md:grid-cols-2">
                <QuizMeCard />
                <HistoryCard />
            </div>
            <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-7">

            </div>
        </main>
    );
}


export default Dashboard;
