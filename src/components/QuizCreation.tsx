import React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useForm} from "react-hook-form";
import {quizCreationSchema} from "@/schemas/form/quiz";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";

type Props = {}

// Rule checking based on the predefined schema - using resolvers to validate the form
type Input = z.infer<typeof quizCreationSchema>;

const QuizCreation = (props: Props) => {
    const form = useForm<Input>({
        resolver: zodResolver(quizCreationSchema),
        defaultValues: {
            topic: "",
            amount: 10,
            type: "open-ended"
        }
    });
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Card className="w-[170px] text-center">
                {/*<Card className="">*/}
                <CardHeader>
                    <CardTitle className="text-2x font-bold">Quiz Creation</CardTitle>
                    <CardDescription>Choose a topic</CardDescription>
                </CardHeader>
                <CardContent></CardContent>
            </Card>
        </div>
    )
}

export default QuizCreation;

