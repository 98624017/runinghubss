import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: process.env.NODE_ENV === "production" ? ["error"] : ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// SQLite WAL 模式优化并发性能（首次连接时执行）
const walInitialized = globalThis as unknown as { __walInit?: boolean };
if (!walInitialized.__walInit) {
  walInitialized.__walInit = true;
  prisma.$executeRawUnsafe("PRAGMA journal_mode=WAL").catch(() => {
    // WAL 模式设置失败不阻塞启动
  });
}
