import {NextResponse} from "next/server";
import {quizCreationSchema} from "@/schemas/form/quiz";
import {logger} from "@/lib/server-logger";
import {strict_output} from "@/lib/gpt";
// import {strict_output} from "@/lib/newGpt";

interface MultipleChoiceQuestion {
    question: string;
    answer: string;
}

interface OpenEndedQuestion {
    question: string;
    answer: string;
}

// Define the type for the question
type Question = MultipleChoiceQuestion | OpenEndedQuestion;


// Current placeholder for the API route
export const GET = async (req: Request, res: Response) => {
    logger.info("GET /api/questions");
    return NextResponse.json(
        {message: "Placeholder for GET request"},
        {status: 200}
    );
}

// Main function for handling POST requests for GPT question generation
// POST /api/questions
export const POST = async (req: Request, res: Response) => {
    try {
        const body = await req.json();
        // Deconstruct the body to get the values and validate them using zod
        const {amount, topic, type} = quizCreationSchema.parse(body);
        let questions: Question | Question[] = [];
        if (type === "open-ended") {
            questions = await strict_output(
                "You are a helpful AI that is able to generate a pair of questions and answers, " +
                "the length of the answer should be around 40/50 characters, store all the pairs of answers and questions into a JSON array ",
                new Array(amount).fill(
                    `You are to generate a hard random open-ended question about ${topic} `
                ),
                {
                    question: "question",
                    answer: "answer with max length of 40/50 characters",
                }
            ) as unknown as MultipleChoiceQuestion[];
        } else if (type === "multiple-choice") {
            questions = await strict_output(
                "You are a helpful AI that is able to generate a pair of questions and answers, " +
                "the length of the answer should be around 40/50 characters, store all the pairs of answers and questions into a JSON array ",
                new Array(amount).fill(
                    `You are to generate a hard random open-ended question about ${topic} `
                ),
                {
                    question: "question",
                    answer: "answer with max length of 40/50 characters",
                }
            ) as unknown as MultipleChoiceQuestion[];
        }
        logger.info(`Questions for -  ${type} - generated successfully`);
        return NextResponse.json({
            questions,
        }, {
            status: 200
        });
    } catch (error) {
        if (error instanceof Error) {
            logger.error("Error in POST /api/questions", error);
            return NextResponse.json(
                {
                    error: error.message
                },
                {
                    status: 400
                });
        }
    }

}