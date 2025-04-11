import {z} from "zod";

export const quizCreationSchema = z.object({
    topic: z
        .string()
        .min(4, {message: "Topic must be at least 4 characters long"})
        .max(100, {message: "Topic must be at most 100 characters long"}),
    type: z
        .enum(["multiple-choice", "open-ended"], {errorMap: () => ({message: "Please select a quiz type"})}),
    amount: z
        .number()
        .min(1, {message: "Amount must be at least 1"})
        .max(30, {message: "Amount must be at most 50"}) // FIXME: test of costs with OpenAI and change it later
})