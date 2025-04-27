"use client";
import React, { useState, useEffect } from "react";
import keyword_extractor from "keyword-extractor";
import { Input } from "@/components/ui/input";

type Props = {
    answer: string;
}

const BlankAnswerInput = ({ answer }: Props) => {
    const [userInput, setUserInput] = useState("");
    const [blankAnswer, setBlankAnswer] = useState("");

    // Extract keywords once on the component mount with smarter selection
    const keywords = React.useMemo(() => {
        // Define common stopwords to filter out
        const stopwords = ["the", "and", "but", "for", "are", "this", "that", "with", "have", "from",
            "was", "is", "at", "by", "to", "of", "in", "on", "a", "an", "they", "it", "he", "she",
            "their", "his", "her", "we", "our", "you", "your", "my", "mine", "as", "be", "been", "being",
            "can", "could", "do", "does", "did", "has", "had", "may", "might", "must", "should", "would", "which", "who"];

        // First, look for numbers in the original string, especially dates and measurements
        const numberMatches = [...answer.matchAll(/\b(\d+(?:(?:\.\d+)|(?:,\d+))*(?:\s*(?:BC|AD|CE|BCE|kg|mm|cm|m|km|°C|°F|%))?\b|\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4})/g)];
        const importantNumbers = numberMatches.map(match => match[0]);

        // Extract keywords from the answer with available options
        const words = keyword_extractor.extract(answer, {
            language: "english",
            remove_digits: false,
            return_changed_case: true,
            remove_duplicates: true,
        });

        // Manually filter out stopwords
        const filteredWords = words.filter(word => !stopwords.includes(word.toLowerCase()));

        // Define importance criteria for words
        const scoreWord = (word: string) => {
            let score = 0;

            // Highly prioritize numbers, especially dates and measurements
            if (/\d/.test(word)) {
                score += 8;

                // Year format (e.g., 1776, 2023)
                if (/^\d{4}$/.test(word)) {
                    score += 6;
                }

                // Date formats
                if (/\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/.test(word)) {
                    score += 8;
                }

                // Measurements with units
                if (/\d+\s*(?:kg|mm|cm|m|km|°C|°F|%)/.test(word)) {
                    score += 7;
                }

                // Large numbers are often important
                if (word.length > 2 && /^\d+$/.test(word)) {
                    score += Math.min(word.length, 5);
                }
            }

            // Longer words tend to be more important
            score += word.length * 0.5;

            // Proper nouns (starting with capital) are often important
            if (word[0] === word[0].toUpperCase() && word.length > 1) {
                score += 3;
            }

            // Words with special characters might be technical terms
            if (/[^\w\s\d]/.test(word)) {
                score += 2;
            }

            // Words that appear only once might be specific terminology
            if (answer.toLowerCase().split(/\s+/).filter(w => w === word.toLowerCase()).length === 1) {
                score += 2;
            }

            return score;
        };

        // Add the important numbers to our word list if they're not already there
        const allWords = [...filteredWords, ...importantNumbers.filter(num => !filteredWords.includes(num))];

        // Filter out small words (unless they're numbers) and score the rest
        const scoredWords = allWords
            .filter(word => word.length >= 4 || /\d/.test(word)) // Keep numbers of any length
            .map(word => ({ word, score: scoreWord(word) }))
            .sort((a, b) => b.score - a.score); // Sort by score descending

        // Take the top 2 most important words
        const final = scoredWords.slice(0, 2).map(item => item.word);

        // If we don't have 2 words yet, try with shorter words as fallback
        if (final.length < 2) {
            const shortWords = allWords
                .filter(word => word.length >= 3 && !final.includes(word))
                .map(word => ({ word, score: scoreWord(word) }))
                .sort((a, b) => b.score - a.score);

            while (final.length < 2 && shortWords.length > 0) {
                final.push(shortWords.shift()!.word);
            }
        }

        return final;
    }, [answer]);

    // Create the blank answer format with underscores replacing keywords
    useEffect(() => {
        let modifiedAnswer = answer;
        keywords.forEach(keyword => {
            // Replace with underscores of appropriate length
            const underscores = '_'.repeat(keyword.length);
            // Use regex with word boundaries to replace whole words only
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            modifiedAnswer = modifiedAnswer.replace(regex, underscores);
        });
        setBlankAnswer(modifiedAnswer);
    }, [answer, keywords]);

    return (
        <div className="flex flex-col w-full mt-4 gap-4">
            <div className="text-xl font-semibold">
                {/* Display the blanked answer with underscores */}
                {blankAnswer.split(' ').map((word, index) => (
                    <span key={index} className={word.includes('_') ? "text-blue-500 underline" : ""}>
            {word}{' '}
          </span>
                ))}
            </div>

            <div className="flex flex-col gap-2">
                <Input
                    type="text"
                    placeholder="Type your answer here..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="p-2 border rounded-md"
                />
                <p className="text-sm text-slate-500">
                    Fill in the blanks with appropriate words. Press Enter to submit.
                </p>
            </div>
        </div>
    );
};

export default BlankAnswerInput;