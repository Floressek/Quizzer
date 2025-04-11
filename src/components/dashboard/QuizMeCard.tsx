"use client"
import React from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {BrainCircuit} from "lucide-react";
import {useRouter} from "next/navigation";

type Props = {}

const QuizMeCard = (props: Props) => {
    const router = useRouter();
    return (
        <Card className="hover:cursor-pointer hover:opacity-75"
              onClick={() => {
                  router.push("/quiz");
              }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-2xl font-bold">Quiz Me!</CardTitle>
                <BrainCircuit size={28} strokeWidth={2.5}></BrainCircuit>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Test your knowledge with our quiz feature. Answer questions and track your progress!
                </p>
            </CardContent>
        </Card>
    );
};

export default QuizMeCard

