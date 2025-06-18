import React from "react";
import {User} from "next-auth";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import Image from "next/image";

type Props = {
    user: Pick<User, "name" |  "image">;
}

// Reusable button component
const UserAvatar = ({user}: Props) => {
    return (
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
        {user.image ? (
                <div className={"relative w-full h-full aspect-square"}>
                    <Image
                        fill
                        src={user.image}
                        alt={"profile information"}
                        referrerPolicy={"no-referrer"}/>
                </div>
            ) : (
                <AvatarFallback>
                    <span className={"sr-only"}>{user?.name}</span>
                </AvatarFallback>
            )}
        </Avatar>
    )
}

export default UserAvatar

