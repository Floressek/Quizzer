"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const FlashcardsCard = () => {
    const router = useRouter();

    return (
        <Card
            onClick={() => router.push("/flashcards")}
            className="hover:cursor-pointer hover:opacity-75"
        >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-2xl font-bold">Flashcards</CardTitle>
                <BookOpen size={28} strokeWidth={2.5} />
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Review your knowledge using flashcards.
                </p>
            </CardContent>
        </Card>
    );
};

export default FlashcardsCard;
