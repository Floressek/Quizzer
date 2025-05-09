"use client";
import React from "react";
import {User} from "next-auth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {signOut} from "next-auth/react";
import {logger} from "@/lib/client-logger";
import {LogOut} from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

type Props = {
    user: Pick<User, "name" | "image" | "email">;
};

const UserAccountNav = ({user}: Props) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <UserAvatar user={user}/>
            </DropdownMenuTrigger>
            {/*Email + Name -- SECTION 1*/}
            <DropdownMenuContent className={"bg-white dark:bg-gray-950"} align={"end"}>
                <div className={"flex items-center justify-start gap-2 p-2"}>
                    <div className={"flex flex-col space-y-1 leading-none"}>
                        {user.name && <p className={"font-medium"}>{user.name}</p>}
                        {user.email && (
                            <p className={"w-[200px] truncate text-sm text-zinc-700"}>
                                {user.email}
                            </p>
                        )}
                    </div>
                </div>

                <DropdownMenuSeparator/>
                {/*CHANGE IT -- SECTION 2*/}
                <DropdownMenuItem asChild>
                    <Link href={'/'}>Placeholder</Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator/>
                {/*SIGN OUT -- SECTION 3*/}
                <DropdownMenuItem onClick={(e)=> { // Onclick event == "use client"
                    e.preventDefault();
                    signOut().catch((err) => {
                        logger.error("Error signing out:", err);
                    });
                }}
                className={"text-red-500 cursor-pointer"}>
                    Sign out
                    <LogOut className={"text-red-500 ml-auto h-4 w-4"}/>
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default UserAccountNav