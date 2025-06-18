"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OCRPage() {
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        setLoading(true);
        const res = await fetch("/api/ocr", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        setText(data.text || "Nie rozpoznano tekstu");
        setLoading(false);
    };

    const handleCreateQuiz = async () => {
        const lines = text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        const questions: {
            question: string;
            answer: string;
            options: string[];
        }[] = [];

        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            const questionMatch = line.match(/^(\d+)\.\s*(.+)/);

            if (questionMatch) {
                const question = questionMatch[2];
                const options: string[] = [];
                let correct = "";

                for (let j = 1; j <= 4; j++) {
                    const optLine = lines[i + j];
                    if (!optLine) continue;

                    const cleaned = optLine.replace(/^\*\*|\*\*$/g, "").trim();
                    options.push(cleaned);

                    if (optLine.startsWith("**")) {
                        correct = cleaned;
                    }
                }

                if (options.length === 4 && correct) {
                    questions.push({
                        question,
                        answer: correct,
                        options: options.sort(() => Math.random() - 0.5),
                    });
                }

                i += 5;
            } else {
                i++;
            }
        }

        const res = await fetch("/api/game/ocr", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                topic: "Quiz z OCR (Multiple Choice)",
                type: "multiple-choice",
                questions,
            }),
        });

        const data = await res.json();
        if (res.ok) {
            window.location.href = `/play/multiple-choice/${data.gameId}`;
        } else {
            alert("Błąd przy tworzeniu quizu: " + data.error);
        }
    };

    return (
        <div className="flex justify-center items-center h-full p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="flex flex-row items-center gap-3">
                    <Upload size={24} />
                    <CardTitle className="text-xl font-semibold">Prześlij obraz do OCR</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Wybierz obraz zawierający pytania i odpowiedzi. Możesz później edytować tekst, by np. oznaczyć poprawne odpowiedzi (**...**).
                    </p>

                    <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={(e) => {
                            const selected = e.target.files?.[0];
                            if (
                                selected &&
                                ["image/jpeg", "image/jpg", "image/png"].includes(selected.type)
                            ) {
                                setFile(selected);
                            } else {
                                setFile(null);
                                alert("Dozwolone są tylko obrazy JPG, JPEG lub PNG.");
                            }
                        }}
                        className="mb-4"
                    />

                    <Button onClick={handleUpload} disabled={!file || loading}>
                        {loading ? "Przetwarzanie..." : "Wyślij i rozpoznaj"}
                    </Button>

                    {text && (
                        <>
                            <label className="mt-4 block text-sm font-medium text-muted-foreground">
                                Edytuj wykryty tekst:
                            </label>
                            <textarea
                                rows={15}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="w-full mt-1 p-2 border rounded-md text-sm"
                            />
                            <Button className="mt-4" onClick={handleCreateQuiz}>
                                Utwórz i rozpocznij quiz
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
