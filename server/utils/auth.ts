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
      // User is not authenticated - this is normal for unauthenticated requests
      return null
    }
    
    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { logtoId: logtoUser.sub },
      select: { id: true, email: true, name: true, phone: true, logtoId: true }
    })
    
    if (!user) {
      // Extract user information from Logto profile
      // Priority: email > username > name > generated fallback
      const name = logtoUser.name || 
                   (logtoUser.given_name && logtoUser.family_name 
                     ? `${logtoUser.given_name} ${logtoUser.family_name}`.trim()
                     : logtoUser.given_name || logtoUser.family_name || null)
      
      const email = logtoUser.email || 
                    (logtoUser.username ? `${logtoUser.username}@example.com` : `user-${logtoUser.sub}@example.com`)
      
      const phone = logtoUser.phone_number || null
      
      // Create user if doesn't exist
      user = await prisma.user.create({
        data: {
          logtoId: logtoUser.sub,
          email,
          name,
          phone
        }
      })
    } else {
      // Update user name if it has changed or was not set before
      const newName = logtoUser.name || 
                      (logtoUser.given_name && logtoUser.family_name 
                        ? `${logtoUser.given_name} ${logtoUser.family_name}`.trim()
                        : logtoUser.given_name || logtoUser.family_name || null)
      
      const newEmail = logtoUser.email || user.email
      const newPhone = logtoUser.phone_number || user.phone
      
      // Only update if there are changes
      if (user.name !== newName || user.email !== newEmail || user.phone !== newPhone) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { 
            name: newName,
            email: newEmail,
            phone: newPhone
          }
        })
      }
    }
    
    return user
  } catch (error) {
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