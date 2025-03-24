import React from "react";
import {getAuthSession} from "@/lib/nextAuth";


type Props = {};

// Runs once on the server
const Navbar = async (props: Props) => {
    const session = await getAuthSession();
    if(session?.user) {
        return <pre>{JSON.stringify(session.user, null, 2)}</pre>
    }
    return <div>Not signed in</div>;
};

export default Navbar;