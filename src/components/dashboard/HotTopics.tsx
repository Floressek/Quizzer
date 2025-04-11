import React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import CustomWordCloud from "@/components/CustomWordCloud";

type Props = {}

const HotTopics = (props: Props) => {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">HotTopics</CardTitle>
                <CardDescription>
                    Click on a topic to start a quiz on it!
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <CustomWordCloud/>
            </CardContent>
        </Card>
    )
}

export default HotTopics

