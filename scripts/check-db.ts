import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Checking database...\n')
    
    // Check users
    const userCount = await prisma.user.count()
    console.log(`👥 Users: ${userCount}`)
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          logtoId: true
        }
      })
      console.log('   Users:', JSON.stringify(users, null, 2))
    }
    
    // Check sessions
    const sessionCount = await prisma.chatSession.count()
    console.log(`\n💬 Chat Sessions: ${sessionCount}`)
    
    if (sessionCount > 0) {
      const sessions = await prisma.chatSession.findMany({
        select: {
          id: true,
          title: true,
          userId: true,
          createdAt: true,
          updatedAt: true
        },
        take: 5
      })
      console.log('   Recent sessions:', JSON.stringify(sessions, null, 2))
    }
    
    // Check messages
    const messageCount = await prisma.message.count()
    console.log(`\n📝 Messages: ${messageCount}`)
    
    console.log('\n✅ Database check complete!')
  } catch (error) {
    console.error('❌ Database error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
