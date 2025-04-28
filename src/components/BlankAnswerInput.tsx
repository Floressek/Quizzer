"use client";
import React, {useState, useEffect, useRef} from "react";

type Props = {
    answer: string;
    setBlankAnswer: React.Dispatch<React.SetStateAction<string>>;
    setFullUserAnswer?: React.Dispatch<React.SetStateAction<string>>;
};

const blank = "_____"
const KEYWORD_MARKER = "$";

const BlankAnswerInput = ({answer, setBlankAnswer, setFullUserAnswer}: Props) => {
    const [markedKeywords, setMarkedKeywords] = useState<string[]>([]);
    const [answerWithoutMarkers, setAnswerWithoutMarkers] = useState("");
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [inputValues, setInputValues] = useState<string[]>([]);
    const [fullAnswer, setFullAnswer] = useState("");

    // Select all keywords with $ and remove the $ sign
    useEffect(() => {
        // Find all keywords with $
        const keywordsWithDollar = answer.match(/\$\w+/g) || [];
        // Delete the $ sign
        const keywords = keywordsWithDollar.map(word => word.substring(1));
        setMarkedKeywords(keywords);

        const cleanAnswer = answer.replace(/\$/g, '');
        setAnswerWithoutMarkers(cleanAnswer);

        // Initialize input values
        setInputValues(new Array(keywords.length).fill(''));
        setFullAnswer(""); // Resetuj pełną odpowiedź
    }, [answer]);

    // Prepare the answer with blanks
    const answerWithBlanks = React.useMemo(() => {
        let processedAnswer = answerWithoutMarkers;

        // Change the marked keywords to blanks
        markedKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            processedAnswer = processedAnswer.replace(regex, blank);
        });

        return processedAnswer;
    }, [answerWithoutMarkers, markedKeywords]);

    // API watermarking the answer
    const prepareAnswerForAPI = (userInputs: string[]): string => {
        if (userInputs.every(input => !input || input.trim() === '')) {
            return '';
        }

        // Watermark the answer with user inputs
        const markedUserInputs = userInputs
            .filter(input => input && input.trim() !== '')
            .map(input => `${KEYWORD_MARKER}${input.trim()}${KEYWORD_MARKER}`)

        return markedUserInputs.join(' ');
    }

    // Function to build the full reconstructed answer
    const buildFullReconstructedAnswer = (userInputs: string[]) => {
        // Copy the answer without markers
        let reconstructed = answerWithoutMarkers;

        // If all inputs are empty, return an empty string
        if (userInputs.every(input => !input || input.trim() === '')) {
            return '';
        }

        // Change the blanks to the user inputs
        markedKeywords.forEach((keyword, index) => {
            if (index < userInputs.length && userInputs[index]) {
                const userInput = userInputs[index].trim();
                if (userInput) {
                    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                    reconstructed = reconstructed.replace(regex, userInput);
                }
            }
        });

        return reconstructed;
    };

    const handleInputChange = (index: number, value: string) => {
        const newInputValues = [...inputValues];
        newInputValues[index] = value;
        setInputValues(newInputValues);

        // Watermarked data
        const apiAnswer = prepareAnswerForAPI(newInputValues);
        setBlankAnswer(apiAnswer);

        // Zbuduj pełną odpowiedź i zaktualizuj stan
        const reconstructed = buildFullReconstructedAnswer(newInputValues);
        setFullAnswer(reconstructed);

        if (setFullUserAnswer) {
            setFullUserAnswer(reconstructed);
        }
    };

    useEffect(() => {
        const blankCount = answerWithBlanks.split(blank).length - 1;
        inputRefs.current = Array(blankCount).fill(null);
    }, [answerWithBlanks]);

    return (
        <div className="flex flex-col justify-start w-full mt-4">
            <h1 className="text-xl font-semibold">
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
                                    value={inputValues[index] || ''}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    ref={el => { inputRefs.current[index] = el; }}
                                    // placeholder="input"
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </h1>
            
            <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                {fullAnswer && (
                    <>
                        <p className="font-medium">Completed answer:</p>
                        <p className="mt-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                            {fullAnswer}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default BlankAnswerInput;