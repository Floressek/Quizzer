import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {cn} from "@/lib/utils";

const inter = Inter({subsets: ["latin"]});
export const metadata: Metadata = {
    title: "Quizzy",
    description: "App for making quizzes from your notes",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className={cn(inter.className, "antialiased min-h-screen pt-16")}>{children}
        </body>
        </html>
    );
}
