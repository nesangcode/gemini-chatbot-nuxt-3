import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const rawSessions = await prisma.chatSession.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        createdAt: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        }
      }
    })

    const sessions = rawSessions
      .map((session) => {
        const lastActivity = session.messages[0]?.createdAt ?? session.createdAt

        return {
          id: session.id,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: lastActivity
        }
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map((session) => ({
        id: session.id,
        title: session.title,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString()
      }))

    return {
      success: true,
      data: sessions
    }
  } catch (error: any) {
    console.error('Error fetching chat sessions:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})
