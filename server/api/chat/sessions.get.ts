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
    
    // If cursor is provided, parse it (format: "timestamp_id")
    if (cursor) {
      try {
        const [timestamp, lastId] = cursor.split('_')
        // Filter: (updatedAt < timestamp) OR (updatedAt = timestamp AND id < lastId)
        whereClause.OR = [
          { updatedAt: { lt: new Date(timestamp) } },
          { 
            AND: [
              { updatedAt: new Date(timestamp) },
              { id: { lt: lastId } }
            ]
          }
        ]
      } catch (e) {
        // Invalid cursor format, ignore and fetch from beginning
      }
    }

    // Fetch sessions sorted by updatedAt (DB now handles this efficiently)
    const rawSessions = await prisma.chatSession.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        model: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { updatedAt: 'desc' }, // Primary: Sort by last update time descending
        { id: 'desc' } // Secondary: Ensure consistent order for same timestamp
      ],
      take: limit + 1 // Fetch one extra to check if there are more
    })
    
    // Check if there are more results
    const hasMore = rawSessions.length > limit
    const sessionsToReturn = hasMore ? rawSessions.slice(0, limit) : rawSessions
    
    const sessions = sessionsToReturn.map(session => ({
      id: session.id,
      title: session.title,
      model: session.model,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString()
    }))
    
    // Cursor is composite: "timestamp_id" of the last session for next page
    const nextCursor = sessions.length > 0 
      ? `${sessions[sessions.length - 1].updatedAt}_${sessions[sessions.length - 1].id}`
      : null

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
    if (error.statusCode) {
      throw error
    }

    // Handle database connection errors
    if (error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1017') {
      throw createError({
        statusCode: 503,
        statusMessage: 'Database connection error. Please try again later.'
      })
    }

    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw createError({
        statusCode: 503,
        statusMessage: 'Network error. Please check your connection.'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})
