import {clsx, type ClassValue} from "clsx"
import {twMerge} from "tailwind-merge"

// Helpful for conditionally joining classNames (tailwind) together
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
