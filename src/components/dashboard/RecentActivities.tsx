import React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";

type Props = {}

const RecentActivities = (props: Props) => {
    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
                <CardTitle className="text-2xl font-bold">
                    Recent Activities
                </CardTitle>
                <CardDescription>
                    {/*TODO: change to the value from db when we will have actual quizzes / metadata regarding them*/}
                    You have played a total of X number of quizzes.
                </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[580px] overflow-scroll">
                History of your played games will be displayed here.
            </CardContent>
        </Card>
    )
}

export default RecentActivities;

