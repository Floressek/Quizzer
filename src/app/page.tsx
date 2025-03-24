"use client"
import {Button} from "@/components/ui/button";
import {logger} from "@/lib/client-logger";
// import {prisma} from "@/lib/db";

export default function Home() {
    return (
        <>
            <Button onClick={() => logger.info("Button clicked")}>Hello World</Button>
        </>
    );
}
