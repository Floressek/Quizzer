import React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import HistoryComponent from "@/components/HistoryComponent";
import { getAuthSession } from "@/lib/nextAuth";

type Props = {}

const RecentActivities = async (props: Props) => {
    const session = await getAuthSession();
    if (!session?.user) {
        return redirect("/");
        }
        return (
            <Card className="col-span-4 lg:col-span-3">
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
                    <HistoryComponent limit={10} userId={session.user.id}/>
                </CardContent>
            </Card>
        )
    }

export default RecentActivities;