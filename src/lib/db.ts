import {PrismaClient} from '@prisma/client';
import "server-only";

declare global {
    // Allow global access to PrismaClient in development
    // eslint-disable-next-line no-var
    var cachedPrisma: PrismaClient | undefined;
}

export let prisma: PrismaClient;
if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient();
} else {
    if (!global.cachedPrisma) {
        global.cachedPrisma = new PrismaClient();
    }
    prisma = global.cachedPrisma;
}