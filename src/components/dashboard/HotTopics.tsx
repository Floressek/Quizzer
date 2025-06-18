import React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import CustomWordCloud from "@/components/CustomWordCloud";

type Props = {}

const HotTopics = (props: Props) => {
    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
        <CardHeader>
                <CardTitle className="text-2xl font-bold">Hot Topics</CardTitle>
                <CardDescription>
                    Click on a topic to start a quiz on it!
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="w-full h-[200px] sm:h-[300px] overflow-hidden">
                    <CustomWordCloud formattedTopics={[]} />
                </div>
            </CardContent>
        </Card>
    )
}

export default HotTopics;

