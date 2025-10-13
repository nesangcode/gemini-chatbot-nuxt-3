import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Updating existing chat sessions with old model values...')
  
  // Update gemini-1.5-flash and old values to gemini-2.5-flash
  const result1 = await prisma.$executeRaw`
    UPDATE "chat_sessions" 
    SET "model" = 'gemini-2.5-flash' 
    WHERE "model" IN ('gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-2.5-flash-exp')
  `
  console.log(`Updated ${result1} sessions to gemini-2.5-flash`)
  
  // Update pro models
  const result2 = await prisma.$executeRaw`
    UPDATE "chat_sessions" 
    SET "model" = 'gemini-2.5-pro' 
    WHERE "model" IN ('gemini-2.5-pro-exp', 'gemini-1.5-pro')
  `
  console.log(`Updated ${result2} sessions to gemini-2.5-pro`)
  
  // Update lite models to 2.0-flash
  const result3 = await prisma.$executeRaw`
    UPDATE "chat_sessions" 
    SET "model" = 'gemini-2.0-flash' 
    WHERE "model" IN ('gemini-1.5-flash-8b', 'gemini-2.0-flash-8b', 'gemini-2.0-flash-lite', 'gemini-2.5-flash-8b', 'gemini-2.5-flash-lite')
  `
  console.log(`Updated ${result3} sessions to gemini-2.0-flash`)
  
  console.log('Migration complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
