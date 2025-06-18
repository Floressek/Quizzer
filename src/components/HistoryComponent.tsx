import { prisma } from '@/lib/db'
import React from 'react'
import Link from "next/link";
import {Clock, CopyCheck, Edit2} from "lucide-react";

type Props = {
    limit: number
    userId: string
}

const HistoryComponent = async (props: Props) => {
    const games = await prisma.game.findMany({
        where: {
            userId: props.userId
        },
        take: props.limit,
        orderBy: {
            timeStarted: 'desc'
        }
    })
    return (
        <div className='space-y-8'>
            {games.map(game => {
                return(
                    <div className="flex items-center justify-between" key={game.id}>
                        <div className="flex items-center">
                            {game.gameType=== 'multiple_choice' ? (
                            <CopyCheck className="mr-3" />
                            ) : (
                              <Edit2 className="mr-3" />
                            )}
                            <div className="ml-4 space-y-1">
                                <Link
                                    href={`/statistics/${game.id}`}
                                    className="text-base font-medium leading-none underlin"
                                    >
                                    {game.topic}
                                </Link>
                                <p className="flex items center px-2 py-1 text-sm text-white rounded-lg w-fit bg-slate-800">
                                   <Clock className="w-4 h-4 mr-1" />
                                {new Date(game.timeStarted).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {game.gameType === 'multiple_choice' ? 'Multiple Choice' : 'Open Ended'}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            })}</div>
    )
}

export default HistoryComponent