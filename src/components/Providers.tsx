"use client";
import * as React from "react"
import {SessionProvider} from "next-auth/react";
import {ThemeProvider} from "next-themes"


const Providers = ({
                       children,
                       ...props
                   }: React.ComponentProps<typeof ThemeProvider>) => {
    return (
        // If laggy transition change add disableTransitionOnChange
        <ThemeProvider attribute={"class"} defaultTheme={"system"} enableSystem {...props}>
            <SessionProvider>
                {children}
            </SessionProvider>
        </ThemeProvider>
    )
}

export default Providers;

