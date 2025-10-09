import type { H3Event } from 'h3'
import { logtoEventHandler } from '#logto'
import { prisma } from '../../lib/prisma'

export async function getUserFromSession(event: H3Event) {
  try {
    const config = useRuntimeConfig(event)
    await logtoEventHandler(event, config)
    
    // Get Logto user from context
    const logtoUser = event.context.logtoUser
    
    if (!logtoUser?.sub) {
      return null
    }
    
    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { logtoId: logtoUser.sub }
    })
    
    if (!user) {
      // Create user if doesn't exist
      user = await prisma.user.create({
        data: {
          logtoId: logtoUser.sub,
          email: logtoUser.email || `user-${logtoUser.sub}@example.com`
        }
      })
    }
    
    return user
  } catch (error) {
    console.error('Error in getUserFromSession:', error)
    return null
  }
}

export async function requireAuth(event: H3Event) {
  const user = await getUserFromSession(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
  
  return user
}