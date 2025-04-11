"use client";
import React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useForm} from "react-hook-form";
import {quizCreationSchema} from "@/schemas/form/quiz";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {BookOpen, CopyCheck} from "lucide-react";
import {Separator} from "@/components/ui/separator";

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

    function onSubmit(input: Input) {
        alert(JSON.stringify(input, null, 2)); // This fragment is for testing purposes
    }

    // Watchdog for the type value in the form
    form.watch("type");

    return (
        // Custom box control
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-12">
            <Card className="w-full h-full">
                <CardHeader>
                    <CardTitle className="text-2x font-bold">Quiz Creation</CardTitle>
                    <CardDescription>Choose a topic</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-8">
                            <FormField
                                control={form.control}
                                name="topic"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Topic</FormLabel>
                                        <FormControl>
                                            <Input autoComplete="off"
                                                   placeholder="Enter a topic..."
                                                   {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Please provide a topic for the quiz.
                                        </FormDescription>
                                        {/*Potential error box message*/}
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Number of questions</FormLabel>
                                        <FormControl>
                                            <Input autoComplete="off"
                                                   placeholder="Enter the amount..."
                                                   {...field}
                                                   type="number"
                                                   onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Please provide a topic for the quiz.
                                        </FormDescription>
                                        {/*Potential error box message*/}
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-between">
                                <Button
                                    type="button"
                                    onClick={() => form.setValue("type", "multiple-choice")}
                                    className="w-1/2 rounded-none rounded-l-lg"
                                        variant={form.getValues().type === "multiple-choice" ? "default" : "secondary"}>
                                    <CopyCheck className="2-4 h-4 mr-2"/>Multiple Choice
                                </Button>
                                <Separator orientation="vertical"/>
                                <Button
                                    type="button"
                                    onClick={() => form.setValue("type", "open-ended")}
                                    className="w-1/2 rounded-none rounded-r-lg"
                                        variant={form.getValues().type === "open-ended" ? "default" : "secondary"}>
                                    <BookOpen className="w-4 h-4 mr-2"/>Open Ended
                                </Button>
                            </div>
                            <Button type="submit">Submit</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

export default QuizCreation;

