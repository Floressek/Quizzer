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
        .min(2, {message: "Amount must be at least 2"})
        .max(30, {message: "Amount must be at most 30"}) // FIXME: endGame of costs with OpenAI and change it later
})

export const checkAnswerSchema = z.object({
    questionId: z.string(),
    userAnswer: z.string(),
    fullUserAnswer: z.string().optional()
})