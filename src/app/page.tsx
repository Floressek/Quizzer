import {Button} from "@/components/ui/button";
import {logger} from "@/lib/client-logger";
import {prisma} from "@/lib/db";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import SignInButton from "@/components/SignInButton";
import {redirect} from "next/navigation";
import {getAuthSession} from "@/lib/nextAuth";

export default async function Home() {
    const session = await getAuthSession();

    if (session?.user) {
        // User is logged in
        return redirect("/dashboard");
    }
    return (
        <div className={"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"}>
            <Card className="w-[300px]">
                <CardHeader>
                    <CardTitle>Welcome to Quizzy</CardTitle>
                    <CardDescription>
                        Quizzy is a quiz application that allows you to create and take quizzes on various topics.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SignInButton text="Sign in with Google!"></SignInButton>
                </CardContent>
            </Card>
        </div>
    );
}
