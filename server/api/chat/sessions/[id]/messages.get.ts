import { prisma } from '../../../../../lib/prisma'
import { requireAuth } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const sessionId = getRouterParam(event, 'id')

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session ID is required'
      })
    }

    const user = await requireAuth(event)

    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id
      }
    })

    if (!session) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Session not found'
      })
    }

    const messages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        role: true,
        createdAt: true
      }
    })

    return {
      success: true,
      data: messages.map((message) => ({
        id: message.id,
        content: message.content,
        role: message.role,
        createdAt: message.createdAt.toISOString()
      }))
    }
  } catch (error: any) {
    console.error('Error fetching messages:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})
