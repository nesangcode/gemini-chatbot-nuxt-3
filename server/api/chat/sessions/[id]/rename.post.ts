import { requireAuth } from '../../../../utils/auth'
import { autoRenameSession, AutoRenameError } from '../../../../utils/session-title'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const sessionId = getRouterParam(event, 'id')

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session ID is required'
      })
    }

    const runtimeConfig = useRuntimeConfig()
    const apiKey = runtimeConfig.geminiApiKey

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Gemini API key not configured'
      })
    }

    try {
      const renamed = await autoRenameSession({
        sessionId,
        userId: user.id,
        apiKey
      })

      return {
        success: true,
        session: renamed
      }
    } catch (renameError) {
      if (renameError instanceof AutoRenameError) {
        if (renameError.code === 'SESSION_NOT_FOUND') {
          throw createError({
            statusCode: 404,
            statusMessage: 'Session not found'
          })
        }

        if (renameError.code === 'NO_MESSAGES') {
          throw createError({
            statusCode: 400,
            statusMessage: 'Cannot rename session with no messages'
          })
        }
      }

      throw renameError
    }
  } catch (error: any) {
    console.error('Error renaming session:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to rename session'
    })
  }
})
