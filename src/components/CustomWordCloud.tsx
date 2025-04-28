"use client";
import { useTheme } from "next-themes";
import React from "react";
import WordCloud from "@/components/D3WordCloud";
import {useRouter} from "next/navigation"; // Custom made component
import { prisma } from "@/lib/db";

type Props = {
    formattedTopics: { text: string; value: number }[];
};

const data = [
    {text: "Hey", value: 3},
    {text: "React", value: 10},
    {text: "TypeScript", value: 8},
    {text: "JavaScript", value: 12},
    {text: "Next.js", value: 1},
    {text: "WordCloud", value: 5},
    {text: "Programming", value: 9},
    {text: "Frontend", value: 6},
    {text: "Development", value: 11},
    {text: "Web", value: 7},
    {text: "Themes", value: 4},
    {text: "Components", value: 61},
    {text: "Visualization", value: 8},
    {text: "Data", value: 10},
    {text: "Coding", value: 9},
    {text: "Learning", value: 7},
    {text: "Design", value: 5},
    {text: "Innovation", value: 6},
    {text: "Creativity", value: 4},
    {text: "Technology", value: 7},
];

const fontSizeMapper = (word: { value: number }) => {
    return Math.log2(word.value) * 5 + 16;
};

const CustomWordCloud = (formattedTopics: Props) => {
    const theme = useTheme();
    const router = useRouter();

    return (
        <WordCloud
            data={data}
            height={550}
            font="Times"
            fontSize={fontSizeMapper}
            rotate={0}
            padding={10}
            fill={theme.theme === "dark" ? "white" : "black"}
            onWordClick={(e, d) => {
                router.push("/quiz?topic=" + d.text);
            }}
        />
    );
};

export default CustomWordCloud;
