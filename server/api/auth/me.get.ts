import { getUserFromSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await getUserFromSession(event)
    
    if (!user) {
      return { user: null }
    }
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        logtoId: user.logtoId
      }
    }
  } catch (error) {
    return { user: null }
  }
})
