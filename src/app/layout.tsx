import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {cn} from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import React from "react";
import {Toaster} from "@/components/ui/sonner";

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
        <html lang="en" suppressHydrationWarning>
        <body className={cn(inter.className, "antialiased min-h-screen pt-16")}>
        <Providers>
            <Navbar/>
            <main className="w-full min-h-screen max-w-7xl mx-auto px-4 sm:px-8 py-6 overflow-x-hidden">
                {children}
            </main>
            <Toaster position="bottom-right" closeButton={true} richColors={true} />
        </Providers>
        </body>
        </html>
    );
}
