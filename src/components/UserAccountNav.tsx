import React from "react";
import {User} from "next-auth";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";

type Props = {
    user: Pick<User, "name" | "image" | "email">;
};

const UserAccountNav = ({user}: Props) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={"flex items-center gap-2 rounded-md border-2 border-black px-2 py-1 text-xl font-bold transition-all hover:-translate-y-[2px] md:block dark:border-white"}>
                <img src={user.image || ""} alt={user.name || ""} className={"h-8 w-8 rounded-full"}/>
                <p className={"hidden md:block"}>{user.name}</p>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem>
                    <a href={"/profile"}>Profile</a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <a href={"/api/auth/signout"}>Sign out</a>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default UserAccountNav