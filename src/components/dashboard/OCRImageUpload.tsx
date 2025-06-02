"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {};

const OCRImageUpload = (props: Props) => {
    const router = useRouter();

    return (
        <Card
            className="hover:cursor-pointer hover:opacity-75"
            onClick={() => {
                router.push("/ocr");
            }}
        >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-2xl font-bold">Wczytaj obraz (OCR)</CardTitle>
                <ImagePlus size={28} strokeWidth={2.5} />
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Prześlij zdjęcie zawierające tekst, a my rozpoznamy jego treść automatycznie.
                </p>
            </CardContent>
        </Card>
    );
};

export default OCRImageUpload;
