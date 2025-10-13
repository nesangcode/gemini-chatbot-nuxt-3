import { prisma } from '~/lib/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const sessionId = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { model } = body

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        message: 'Session ID is required',
      })
    }

    if (!model || typeof model !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'Model is required and must be a string',
      })
    }

    // Verify session belongs to user
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    })

    if (!session || session.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You are not allowed to access this chat session.',
      })
    }

    // Update the model
    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: { model },
      select: {
        id: true,
        title: true,
        model: true,
        createdAt: true,
      },
    })

    return {
      success: true,
      data: {
        id: updatedSession.id,
        title: updatedSession.title,
        model: updatedSession.model,
        createdAt: updatedSession.createdAt.toISOString(),
      },
    }
  } catch (error: any) {
    console.error('Error updating session model:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    })
  }
})
