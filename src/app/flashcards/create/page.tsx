"use client";
import React, { useState } from "react";
//import Flashcard from "@/components/ui/Flashcard/Flashcard";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

type Card = {
    front: string;
    back: string;
};

export default function CreateFlashcardsPage() {
    const [title, setTitle] = useState("");
    const [cards, setCards] = useState<Card[]>([{ front: "", back: "" }]);
    const router = useRouter();

    const handleChange = (index: number, field: "front" | "back", value: string) => {
        const updated = [...cards];
        updated[index][field] = value;
        setCards(updated);
    };

    const handleAddCard = () => {
        setCards([...cards, { front: "", back: "" }]);
    };

    const handleDuplicate = (index: number) => {
        const newCard = { ...cards[index] };
        setCards([...cards, newCard]);
    };

    const handleRemove = (index: number) => {
        const updated = cards.filter((_, i) => i !== index);
        setCards(updated);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.warning("Please enter a title before saving.");
            return;
        }

        const res = await fetch("/api/flashcards/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, cards }),
        });

        if (res.ok) {
            const saved = await res.json();
            router.push(`/flashcards/set/${saved.id}`);
        } else {
            toast.error("Failed to save flashcard set.");
        }
    };


    return (
        <div className="p-6 max-w-2xl mx-auto flex flex-col gap-6">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Set title..."
                className="text-2xl font-bold bg-transparent outline-none border-b border-gray-500 focus:border-white transition"
            />

            {cards.map((card, index) => (
                <div key={index} className="border rounded p-4 bg-zinc-900 space-y-2 relative">
                    <input
                        type="text"
                        value={card.front}
                        onChange={(e) => handleChange(index, "front", e.target.value)}
                        placeholder="Question"
                        className="w-full p-2 rounded bg-zinc-800 text-white"
                    />
                    <textarea
                        value={card.back}
                        onChange={(e) => handleChange(index, "back", e.target.value)}
                        placeholder="Answer"
                        className="w-full p-2 rounded bg-zinc-800 text-white h-24 resize-none"
                    />
                    <div className="flex justify-end gap-2 text-sm mt-2">
                        <button onClick={() => handleDuplicate(index)} title="Duplicate" className="text-blue-400 hover:underline">
                            Duplicate
                        </button>
                        <button onClick={() => handleRemove(index)} title="Remove" className="text-red-400 hover:underline">
                            Remove
                        </button>
                    </div>
                </div>
            ))}

            <button
                onClick={handleAddCard}
                className="w-full p-3 bg-zinc-800 text-white rounded hover:bg-zinc-700 text-center"
            >
                Add Flashcard
            </button>

            {cards.length > 0 && (
                <>
                    <button
                        onClick={handleSave}
                        className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4 font-semibold"
                    >
                        Save Set
                    </button>

                    <Link
                        href="/flashcards"
                        className="text-sm text-blue-400 hover:underline text-center block mt-2"
                    >
                        ← Back to Flashcards
                    </Link>
                </>
            )}

        </div>
    );
}
