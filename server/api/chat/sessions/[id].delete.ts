import { prisma } from '../../../../lib/prisma'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const sessionId = getRouterParam(event, 'id')

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        message: 'Session ID is required',
      })
    }

    // Verify session belongs to user
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    })

    if (!session) {
      throw createError({
        statusCode: 404,
        message: 'Chat session not found',
      })
    }

    if (session.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You are not allowed to delete this chat session.',
      })
    }

    // Delete session (cascade will delete messages)
    await prisma.chatSession.delete({
      where: { id: sessionId },
    })

    return {
      success: true,
      message: 'Chat session deleted successfully',
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
