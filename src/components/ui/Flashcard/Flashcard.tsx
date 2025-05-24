"use client";
import React, { useState } from "react";
import "./Flashcard.css";

type FlashcardProps = {
    front: string;
    back: string;
};

const Flashcard = ({ front, back }: FlashcardProps) => {
    const [flipped, setFlipped] = useState(false);

    return (
        <div className="flip-card w-full max-w-md h-64" onClick={() => setFlipped(!flipped)}>
            <div className={`flip-inner ${flipped ? "flipped" : ""}`}>
                <div className="flip-front">
                    <div
                        className="p-4 text-center"
                        dangerouslySetInnerHTML={{
                            __html: highlightKeywords(front),
                        }}
                    />
                </div>
                <div className="flip-back">
                    <div
                        className="p-4 text-center"
                        dangerouslySetInnerHTML={{
                            __html: highlightKeywords(back),
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

function highlightKeywords(text: string): string {
    return text.replace(/\$([a-zA-Z0-9]+)/g, `<span class="font-semibold text-blue-400">$1</span>`);
}

export default Flashcard;
