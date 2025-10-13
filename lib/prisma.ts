import pkg from '@prisma/client'
const { PrismaClient } = pkg

const globalForPrisma = globalThis as unknown as {
  prisma: typeof PrismaClient.prototype | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV !== 'production' ? ['query', 'error', 'warn'] : ['error']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma