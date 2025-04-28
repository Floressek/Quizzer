"use client";
import * as React from "react"
import {SessionProvider} from "next-auth/react";
import {ThemeProvider as NextThemesProvider} from "next-themes"
import {QueryClient, QueryClientProvider} from "@tanstack/react-query"

// Caching provider for a react-query
const queryClient = new QueryClient();

const Providers = ({
                       children,
                       ...props
                   }: React.ComponentProps<typeof NextThemesProvider>) => {
    return (
        // If laggy transition, add disableTransitionOnChange
        <QueryClientProvider client={queryClient}>
            <NextThemesProvider
                attribute={"class"}
                defaultTheme={"system"}
                enableSystem
                {...props}>
                <SessionProvider>
                    {children}
                </SessionProvider>
            </NextThemesProvider>
        </QueryClientProvider>
    )
}

export default Providers;

