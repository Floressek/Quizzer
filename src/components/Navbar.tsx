import React from "react";
import Link from "next/link";
import {getAuthSession} from "@/lib/nextAuth";


type Props = {};

// Runs once on the server
const Navbar = async (props: Props) => {
    // const session = await getAuthSession();
    // if(session?.user) {
    //     return <pre>{JSON.stringify(session.user, null, 2)}</pre>
    // }
    // return <div>Not signed in</div>;
    return (
        <div className={"fixed inset-x-0 top-0 bg-white dark:bg-gray-950 z-[10] h-fit border-b border-zinc-300 py-2"}>
            <div className={"flex items-center justify-between h-full gap-2 px-8 mx-auto max-w-7xl"}>
                {/* Logo */}
                <Link href={"/"} className={"flex items-center gap-2"}>
                    <p className={"rounded-lg border-2 border-b-4 border-r-4 border-black px-2 py-1 text-xl font-bold transition-all hover:-translate-y-[2px] md:block dark:border-white"}>
                        Quizzy
                    </p>
                </Link>
                <div className={"flex items-center gap-2"}>

                </div>
            </div>
        </div>
    )
};

export default Navbar;