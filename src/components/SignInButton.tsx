import React from "react";
import {Button} from "@/components/ui/button";
import {signIn} from "next-auth/react";
import {logger} from "@/lib/client-logger";

type Props = {
    text: string
}

// Reusable button component
const SignInButton = ({text}: Props) => {
    return (
        <Button onClick={() => {
            signIn("google").catch(logger.error);
        }}>
            {text}
        </Button>
    )
}

export default SignInButton

