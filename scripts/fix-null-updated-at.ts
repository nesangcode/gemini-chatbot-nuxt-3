import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixNullUpdatedAt() {
  try {
    console.log('🔧 Fixing NULL updatedAt values...\n')
    
    // Find sessions with NULL updatedAt
    const sessionsWithNull = await prisma.$queryRaw`
      SELECT id, "createdAt", "updatedAt" 
      FROM chat_sessions 
      WHERE "updatedAt" IS NULL
    `
    
    console.log(`Found ${(sessionsWithNull as any[]).length} sessions with NULL updatedAt`)
    
    if ((sessionsWithNull as any[]).length > 0) {
      // Update them to use createdAt
      const result = await prisma.$executeRaw`
        UPDATE chat_sessions 
        SET "updatedAt" = "createdAt" 
        WHERE "updatedAt" IS NULL
      `
      
      console.log(`✅ Updated ${result} sessions`)
    } else {
      console.log('✅ All sessions already have updatedAt values')
    }
    
    // Verify
    const totalSessions = await prisma.chatSession.count()
    console.log(`\n📊 Total sessions: ${totalSessions}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixNullUpdatedAt()
