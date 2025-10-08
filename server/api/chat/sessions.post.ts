import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const newSession = await prisma.chatSession.create({
      data: {
        userId: user.id
      }
    })

    return {
      success: true,
      data: {
        id: newSession.id,
        title: newSession.title,
        createdAt: newSession.createdAt.toISOString(),
        updatedAt: newSession.createdAt.toISOString()
      }
    }
  } catch (error: any) {
    console.error('Error creating chat session:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})
