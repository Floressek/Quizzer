"use client"

import {useTheme} from "next-themes"
import {Toaster as Sonner, toast as sonnerToast, ToasterProps} from "sonner"
import React from "react"
import {cn} from "@/lib/utils"
import {CheckCircle2, XCircle, Info, AlertTriangle, Bell} from "lucide-react"

const toast = {
    ...sonnerToast,
    // Powiadomienia z ikonami
    success: (message: string, data?: any) =>
        sonnerToast.success(message, {
            icon: <CheckCircle2 className="h-5 w-5 text-green-500"/>,
            className: "border-l-4 border-green-500",
            ...data
        }),

    error: (message: string, data?: any) =>
        sonnerToast.error(message, {
            icon: <XCircle className="h-5 w-5 text-red-500"/>,
            className: "border-l-4 border-red-500",
            ...data
        }),

    info: (message: string, data?: any) =>
        sonnerToast.info(message, {
            icon: <Info className="h-5 w-5 text-blue-500"/>,
            className: "border-l-4 border-blue-500",
            ...data
        }),

    warning: (message: string, data?: any) =>
        sonnerToast.warning(message, {
            icon: <AlertTriangle className="h-5 w-5 text-yellow-500"/>,
            className: "border-l-4 border-yellow-500",
            ...data
        }),

    // Powiadomienie z przyciskiem akcji
    action: (
        message: string,
        {action, ...data}: {
            action: { label: string; onClick: () => void }
        } & Record<string, any>
    ) =>
        sonnerToast(message, {
            icon: <Bell className="h-5 w-5 text-indigo-500"/>,
            className: "border-l-4 border-indigo-500",
            action,
            ...data
        }),

    // Powiadomienie z czasowym postępem
    progress: (message: string, {duration = 5000, ...data}: Record<string, any> = {}) => {
        const toastId = sonnerToast.loading(message, {
            className: "border-l-4 border-purple-500",
            duration: duration + 500, // Dodajemy małe opóźnienie, aby zobaczyć kompletny pasek
            ...data
        })

        // Mierzenie postępu
        const start = Date.now()
        const interval = setInterval(() => {
            const elapsedTime = Date.now() - start
            const progress = Math.min(elapsedTime / duration, 1)

            sonnerToast.loading(message, {
                id: toastId,
                className: "border-l-4 border-purple-500",
                description: `Postęp: ${Math.floor(progress * 100)}%`,
                style: {
                    '--progress': `${progress * 100}%`,
                } as React.CSSProperties,
                ...data
            })

            if (progress === 1) {
                clearInterval(interval)
                sonnerToast.success(message, {
                    id: toastId,
                    icon: <CheckCircle2 className="h-5 w-5 text-green-500"/>,
                    className: "border-l-4 border-green-500",
                    description: "Zakończono pomyślnie!",
                    ...data
                })
            }
        }, 100)

        return toastId
    }
}

// Definicja typów
interface CustomToastProps extends ToasterProps {
    containerClassName?: string;
}

const Toaster = ({containerClassName, ...props}: CustomToastProps) => {
    const {theme = "system"} = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className={cn("toaster group", containerClassName)}
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    title: "group-[.toast]:text-foreground group-[.toast]:font-semibold",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                    success: "group-[.toaster]:text-green-600 dark:group-[.toaster]:text-green-500 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:bg-green-500 before:w-1",
                    error: "group-[.toaster]:text-red-600 dark:group-[.toaster]:text-red-500 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:bg-red-500 before:w-1",
                    loading: "group-[.toaster]:text-blue-600 dark:group-[.toaster]:text-blue-500 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:bg-blue-500 before:w-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-1 after:bg-blue-500 after:opacity-50 after:[transform-origin:left] after:[transition:width_0.1s_linear] after:[width:var(--progress,0%)]",
                },
            }}
            style={{
                "--normal-bg": "var(--popover)",
                "--normal-text": "var(--popover-foreground)",
                "--normal-border": "var(--border)",
            } as React.CSSProperties}
            {...props}
        />
    )
}

export {Toaster, toast}