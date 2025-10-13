import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugSessions() {
  try {
    console.log('🔍 Debugging sessions...\n')
    
    const userId = 'cmgfvx7li0000hyj4j58vcigl'
    
    // Get all sessions for this user
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    })
    
    console.log(`Total sessions for user: ${sessions.length}\n`)
    
    // Show first 10
    console.log('First 10 sessions (ordered by updatedAt DESC):')
    sessions.slice(0, 10).forEach((s, i) => {
      console.log(`${i + 1}. ${s.id} - updatedAt: ${s.updatedAt?.toISOString() || 'NULL'}`)
    })
    
    // Check for NULL or invalid dates
    const nullOrInvalid = sessions.filter(s => !s.updatedAt || isNaN(s.updatedAt.getTime()))
    console.log(`\n⚠️  Sessions with NULL or invalid updatedAt: ${nullOrInvalid.length}`)
    
    if (nullOrInvalid.length > 0) {
      nullOrInvalid.forEach(s => {
        console.log(`  - ${s.id}: ${s.updatedAt}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugSessions()
