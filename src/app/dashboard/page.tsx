import React from 'react';
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/nextAuth";
import QuizMeCard from "@/components/dashboard/QuizMeCard";
import HistoryCard from "@/components/dashboard/HistoryCard";
import HotTopics from "@/components/dashboard/HotTopics";
import RecentActivities from "@/components/dashboard/RecentActivities";
import OCRImageUpload from "@/components/dashboard/OCRImageUpload";
import FlashcardsCard from "@/components/dashboard/FlashcardsCard";

type Props = {};

export const metadata = {
    title: "Dashboard | Quizzy",
    description: "Dashboard page",
};

const Dashboard = async (props: Props) => {
    const session = await getAuthSession();
    if (!session?.user) {
        redirect("/?error=auth_required");
    }

    return (
        <main className="p-8 mx-auto max-w-7xl space-y-8">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <QuizMeCard />
                <HistoryCard />
                <OCRImageUpload />
                <FlashcardsCard />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                <div className="min-w-0">
                    <HotTopics />
                </div>
                <div className="min-w-0">
                    <RecentActivities />
                </div>
            </div>
        </main>
    );
};

export default Dashboard;
