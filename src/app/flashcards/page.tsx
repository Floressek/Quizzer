"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function FlashcardsPage() {
    const [sets, setSets] = useState<any[]>([]);

    useEffect(() => {
        const fetchSets = async () => {
            const res = await fetch("/api/flashcards/list");
            if (res.ok) {
                const data = await res.json();
                setSets(data);
            }
        };
        fetchSets();
    }, []);

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/flashcards/delete/${id}`, {
            method: "DELETE",
        });

        if (res.ok) {
            setSets((prev) => prev.filter((s) => s.id !== id));
        } else {
            console.error("Failed to delete set");
        }
    };


    return (
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
            <h1 className="text-3xl font-bold text-center">Your Flashcard Sets</h1>

            <div className="space-y-4">
                {sets.length > 0 ? (
                    sets.map((set) => (
                        <div
                            key={set.id}
                            className="flex justify-between items-center p-4 bg-zinc-900 rounded border hover:bg-zinc-800 transition"
                        >
                            <Link href={`/flashcards/set/${set.id}`}>
                                <div>
                                    <div className="font-semibold text-lg">{set.title}</div>
                                    <div className="text-sm text-gray-400">
                                        {set.cards.length} cards · Created{" "}
                                        {new Date(set.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </Link>
                            <button
                                onClick={() => handleDelete(set.id)}
                                className="text-sm text-red-400 hover:underline ml-4"
                            >
                                Delete
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400">You haven’t created any flashcard sets yet.</p>
                )}
            </div>

            <div className="space-y-3 pt-8 border-t border-zinc-700">
                <Link
                    href="/flashcards/create"
                    className="block bg-gray-700 hover:bg-gray-800 rounded px-4 py-3 text-center text-white"
                >
                    Create Your Own Set
                </Link>
                <Link
                    href="/flashcards/history"
                    className="block bg-gray-700 hover:bg-gray-800 rounded px-4 py-3 text-center text-white"
                >
                    Use Quiz History
                </Link>
            </div>
        </div>
    );
}
