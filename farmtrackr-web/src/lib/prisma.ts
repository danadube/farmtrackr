import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use Prisma Accelerate URL if available, otherwise fall back to standard connection
// Vercel Prisma Postgres provides POSTGRES_PRISMA_PRISMA_DATABASE_URL for Accelerate
// or POSTGRES_PRISMA_POSTGRES_URL for standard connection
const databaseUrl = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_PRISMA_PRISMA_DATABASE_URL ||
  process.env.POSTGRES_PRISMA_POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL

if (!databaseUrl) {
  console.error('No database URL found. Please set DATABASE_URL, POSTGRES_PRISMA_PRISMA_DATABASE_URL, POSTGRES_PRISMA_POSTGRES_URL, or POSTGRES_PRISMA_URL')
}

// Set DATABASE_URL for Prisma if it's not already set
if (!process.env.DATABASE_URL && databaseUrl) {
  process.env.DATABASE_URL = databaseUrl
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl || process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
