import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    
    // Parse query parameters for pagination
    const query = getQuery(event)
    const limit = query.limit ? parseInt(query.limit as string) : 20
    const cursor = query.cursor ? (query.cursor as string) : null
    
    // Build the query with pagination
    const whereClause: any = { userId: user.id }
    
    // If cursor is provided, filter sessions created before the cursor
    if (cursor) {
      whereClause.id = {
        lt: cursor
      }
    }

    const rawSessions = await prisma.chatSession.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        createdAt: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1 // Fetch one extra to check if there are more
    })
    
    // Check if there are more results
    const hasMore = rawSessions.length > limit
    const sessionsToReturn = hasMore ? rawSessions.slice(0, limit) : rawSessions

    type SessionWithActivity = {
      id: string
      title: string
      createdAt: Date
      updatedAt: Date
    }

    const sessions = sessionsToReturn
      .map((session): SessionWithActivity => {
        const lastActivity = session.messages[0]?.createdAt ?? session.createdAt

        return {
          id: session.id,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: lastActivity
        }
      })
      .sort((a: SessionWithActivity, b: SessionWithActivity) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map((session: SessionWithActivity) => ({
        id: session.id,
        title: session.title,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString()
      }))
    
    // Get the cursor for the next page (last session id)
    const nextCursor = sessions.length > 0 ? sessions[sessions.length - 1].id : null

    return {
      success: true,
      data: sessions,
      pagination: {
        limit,
        cursor: nextCursor,
        hasMore
      }
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
