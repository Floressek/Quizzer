import {NextResponse} from "next/server";
import {quizCreationSchema} from "@/schemas/form/quiz";
import {logger} from "@/lib/server-logger";
import {strict_output} from "@/lib/newGpt";
import {getAuthSession} from "@/lib/nextAuth";

interface MultipleChoiceQuestion {
    question: string;
    answer: string;
    options?: string[]; // Dodajemy opcje dla pytań wielokrotnego wyboru
}

interface OpenEndedQuestion {
    question: string;
    answer: string;
}

interface OutputItem {
    question: string;
    answer: string;
    options?: string[];
    option1?: string;
    option2?: string;
    option3?: string;
    option4?: string;
}


// Define the type for the question
type Question = MultipleChoiceQuestion | OpenEndedQuestion;

// Function to convert OutputItem to Question
function convertToQuestion(item: OutputItem): Question {
    if (item.options) {
        // Handle case where options is already an array
        return {
            question: item.question,
            answer: item.answer,
            options: item.options
        } as MultipleChoiceQuestion;
    } else if (item.option1) {
        // Combine individual options into an array
        const options = [
            item.option1,
            item.option2,
            item.option3,
            item.option4
        ].filter(option => option !== undefined);

        return {
            question: item.question,
            answer: item.answer,
            options: options
        } as MultipleChoiceQuestion;
    } else {
        return {
            question: item.question,
            answer: item.answer
        } as OpenEndedQuestion;
    }
}


// Current placeholder for the API route
// GET /api/questions
export async function GET(request: Request) {
    logger.info("GET /api/questions");
    return NextResponse.json(
        {message: "Placeholder for GET request"},
        {status: 200}
    );
}


// Main function for handling POST requests for GPT question generation
// POST /api/questions
export async function POST(req: Request) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            // User is not logged in
            return NextResponse.json(
                {
                    error: "User not authenticated. You must be logged in to access this resource."
                },
                {
                    status: 401
                });
        }
        const body = await req.json();
        // Deconstruct the body to get the values and validate them using zod
        const {amount, topic, type} = quizCreationSchema.parse(body);
        let questions: Question[] = [];

        if (type === "open-ended") {
            // Generowanie pytań otwartych
            const prompts = new Array(amount).fill(
                `Generate a hard random open-ended question about ${topic}`
            );

            const result = await strict_output(
                "You are a helpful AI that is able to generate a pair of questions and answers, " +
                "the length of the answer should be around 40/50 characters. Be sure to include the question and answer in the JSON output",
                prompts,
                {
                    question: "string",
                    answer: "string with the correct answer max length of 40/50 characters",
                },
                "",
                false,
                "gpt-4o-2024-08-06",
                0.7,
                3,
                false,
                false // Wyłączamy weryfikację treści narazie dla testow
            );

            // Upewnij się, że result jest tablicą
            questions = Array.isArray(result)
                ? (result as unknown as OutputItem[]).map(item => convertToQuestion(item as OutputItem))
                : [convertToQuestion(result as unknown as OutputItem)];

        } else if (type === "multiple-choice") {
            // Generowanie pytań wielokrotnego wyboru
            const prompts = new Array(amount).fill(
                `Generate a hard random multiple-choice question about ${topic}`
            );

            const result = await strict_output(
                "You are a helpful AI that is able to generate multiple-choice questions. " +
                "For each question, provide: the question text, 4 possible answer options, and the correct answer. " +
                "Make sure the correct answer is one of the options.",
                prompts,
                {
                    question: "string",
                    option1: "1st option",
                    option2: "2nd option",
                    option3: "3rd option",
                    option4: "4th option",
                    // options: ["string", "string", "string", "string"],
                    answer: "string with the correct answer (must be one of the options)"
                },
                "",
                false,
                "gpt-4o-2024-08-06",
                0.7,
                3,
                false,
                true // Włączamy weryfikację treści
            );

            // Upewnij się, że result jest tablicą
            questions = Array.isArray(result)
                ? (result as unknown as OutputItem[]).map(item => convertToQuestion(item as OutputItem))
                : [convertToQuestion(result as unknown as OutputItem)];
        }

        logger.info(`Wygenerowano ${questions.length} pytań typu ${type} o temacie "${topic}"`);

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
        return NextResponse.json(
            {
                error: "Wystąpił nieznany błąd"
            },
            {
                status: 500
            }
        );
    }
}