import React from "react";
import {getAuthSession} from "@/lib/nextAuth";
import {redirect} from "next/navigation";
import QuizCreation from "@/components/QuizCreation";

type Props = {}

export const metadata = {
    title: "Quiz | Quizzy",
    description: "Quiz Page",
}

const Quiz = async (props: Props) => {
    const session = await getAuthSession();
    if (!session?.user) {
        // User is not logged in
        redirect("/?error=auth_required");
    }
    return (
        <QuizCreation/>
    )
}

export default Quiz;

