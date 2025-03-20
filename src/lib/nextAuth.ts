import {DefaultSession, NextAuthOptions} from 'next-auth';
import {PrismaAdapter} from '@next-auth/prisma-adapter';
import GoogleProvider from "next-auth/providers/google";
import {prisma} from "@/lib/db";


// Override the default NextAuth session type
declare module 'next-auth' {
    interface Session extends DefaultSession {
        user: {
            id: string;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
    }
}

// NextAuth configuration
export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        jwt: async ({token}) => {
            const db_user = await prisma.user.findFirst({
                where: {
                    email: token?.email,
                },
            })
            if (db_user) {
                token.id = db_user.id;
            }
            return token;
        },
        session: async ({session, token}) => {
            if (token) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.image = token.picture; // is a string or undefined that is the url of the image user uploaded
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '' as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '' as string, // created in google cloud console
        }),
    ]
}