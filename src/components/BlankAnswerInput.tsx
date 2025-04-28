"use client";
import React, {useState, useEffect, useRef} from "react";

type Props = {
    answer: string;
};

const blank = "_____"

const BlankAnswerInput = ({answer}: Props) => {
    const [markedKeywords, setMarkedKeywords] = useState<string[]>([]);
    const [answerWithoutMarkers, setAnswerWithoutMarkers] = useState("");
    // Ref for the input field
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);


    // Extract keywords marked with $ symbol and clean the answer
    useEffect(() => {
        // Find all keywords marked with $
        const keywordsWithDollar = answer.match(/\$\w+/g) || [];
        // Delete the $ sign from the keywords
        const keywords = keywordsWithDollar.map(word => word.substring(1));
        setMarkedKeywords(keywords);

        const cleanAnswer = answer.replace(/\$/g, '');
        setAnswerWithoutMarkers(cleanAnswer);

        // Refreshing the inputRefs array
        inputRefs.current.forEach(input => {
            if (input) {
                input.value = ""; // Clear the input field
            }
        });
    }, [answer]);

    // Prepare an answer with blanks for rendering
    const answerWithBlanks = React.useMemo(() => {
        let processedAnswer = answerWithoutMarkers;

        // Change the marked keywords to blanks
        markedKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            processedAnswer = processedAnswer.replace(regex, blank);
        });

        return processedAnswer;
    }, [answerWithoutMarkers, markedKeywords]);

    useEffect(() => {
        const blankCount = answerWithBlanks.split(blank).length - 1; // Count the number of blanks
        inputRefs.current = Array(blankCount).fill(null); // Initialize the refs array with nulls
    }, [answerWithBlanks]);

    return (
        <div className="flex justify-start w-full mt-4">
            <h1 className="text-xl font-semibold">
                {/* Zamień podkreślniki na pola do wpisywania */}
                {answerWithBlanks.split(blank).map((part, index) => {
                    return (
                        <React.Fragment key={`${part}-${index}-${answer}`}>
                            {part}
                            {index === answerWithBlanks.split(blank).length - 1 ? (
                                ""
                            ) : (
                                <input
                                    id={`user-blank-input-${index}`}
                                    className="text-center border-b-2 border-black dark:border-white w-28 focus:border-2 focus:border-b-4 focus:outline-none"
                                    type="text"
                                    // Adding the value of the keyword to the input field
                                    key={`input-${answer}-${index}`}
                                    // Save the keyword in the input field
                                    ref={el => { inputRefs.current[index] = el; }}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </h1>
        </div>
    );
};

export default BlankAnswerInput;