"use client";
import React, { useState } from "react";

type Props = {
    onSave: (front: string, back: string) => void;
};

const FlashcardForm = ({ onSave }: Props) => {
    const [front, setFront] = useState("");
    const [back, setBack] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!front || !back) return;
        onSave(front, back);
        setFront("");
        setBack("");
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md w-full">
            <input
                type="text"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Enter question..."
                className="border rounded px-3 py-2 bg-gray-900 text-white"
            />
            <textarea
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Enter answer..."
                className="border rounded px-3 py-2 bg-gray-900 text-white h-24 resize-none"
            />
            <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
            >
                Save Flashcard
            </button>
        </form>
    );
};

export default FlashcardForm;
