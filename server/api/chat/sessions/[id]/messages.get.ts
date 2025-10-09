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
    const limit = Math.min(parseInt(query.limit as string) || 20, 50) // Default 20, max 50
    const offset = parseInt(query.offset as string) || 0
    const cursor = query.cursor as string

    let whereClause: any = { sessionId }
    let orderBy: any = { createdAt: 'asc' }

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
      data: messages.map((message) => ({
        id: message.id,
        content: message.content,
        role: message.role,
        createdAt: message.createdAt.toISOString()
      })),
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

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})
