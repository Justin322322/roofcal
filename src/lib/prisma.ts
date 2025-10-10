import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    transactionOptions: {
      timeout: 10000, // 10 seconds timeout for transactions
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
