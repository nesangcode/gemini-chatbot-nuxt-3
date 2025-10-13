import { prisma } from '../../../../../lib/prisma'
import { requireAuth } from '../../../../utils/auth'
import { getQuery, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const sessionId = getRouterParam(event, 'id')
    const query = getQuery(event)

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session ID is required'
      })
    }

    // Pagination parameters
    const limit = Math.min(parseInt(query.limit as string) || 10, 50) // Default 10, max 50
    const offset = parseInt(query.offset as string) || 0
    const cursor = query.cursor as string

    let whereClause: any = { sessionId }
    // Order by descending to get newest messages first, then reverse in client
    // This ensures with limit=10, we get the 10 most recent messages
    let orderBy: any = { createdAt: 'desc' }

    // If cursor is provided, use cursor-based pagination
    if (cursor) {
      whereClause.createdAt = { gt: new Date(cursor) }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy,
      take: limit,
      skip: cursor ? 0 : offset, // Don't skip if using cursor
      select: {
        id: true,
        content: true,
        role: true,
        createdAt: true
      }
    })

    type MessageResult = typeof messages[number]

    // Get total count for pagination metadata
    const totalCount = await prisma.message.count({
      where: { sessionId }
    })

    // Check if there are more messages
    const hasMore = messages.length === limit

    // Get next cursor (createdAt of last message)
    const nextCursor = hasMore && messages.length > 0
      ? messages[messages.length - 1].createdAt.toISOString()
      : null

    return {
      success: true,
      // Reverse to show oldest-to-newest in UI (since we fetched desc)
      data: messages.map((message: MessageResult) => {
        // Try to parse JSON content for multimodal messages
        let parsedContent = message.content
        try {
          const parsed = JSON.parse(message.content)
          // If it parses successfully and has the multimodal type, keep parsed version
          if (parsed.type === 'multimodal') {
            parsedContent = parsed
          }
        } catch {
          // Not JSON or parse failed - keep original string content
        }
        
        return {
          id: message.id,
          content: parsedContent,
          role: message.role,
          createdAt: message.createdAt.toISOString()
        }
      }).reverse(),
      pagination: {
        total: totalCount,
        limit,
        offset: cursor ? null : offset,
        cursor: nextCursor,
        hasMore
      }
    }
  } catch (error: any) {
    console.error('Error fetching messages:', error)

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
