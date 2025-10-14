import { d as defineEventHandler, l as getRouterParam, k as getQuery, e as createError, p as prisma } from '../../../../../_/nitro.mjs';
import 'unified';
import 'remark-parse';
import 'remark-rehype';
import 'remark-mdc';
import 'remark-gfm';
import 'rehype-external-links';
import 'rehype-sort-attribute-values';
import 'rehype-sort-attributes';
import 'rehype-raw';
import 'detab';
import 'micromark-util-sanitize-uri';
import 'hast-util-to-string';
import 'github-slugger';
import 'node:module';
import '@ai-sdk/google';
import 'ai';
import '@prisma/client';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import '@iconify/utils';
import 'node:crypto';
import 'consola';
import '@logto/node';
import '@silverhand/essentials';
import 'node:url';
import 'ipx';
import 'node:fs';
import 'node:path';

const messages_get = defineEventHandler(async (event) => {
  try {
    const sessionId = getRouterParam(event, "id");
    const query = getQuery(event);
    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Session ID is required"
      });
    }
    const limit = Math.min(parseInt(query.limit) || 10, 50);
    const offset = parseInt(query.offset) || 0;
    const cursor = query.cursor;
    let whereClause = { sessionId };
    let orderBy = { createdAt: "desc" };
    if (cursor) {
      whereClause.createdAt = { gt: new Date(cursor) };
    }
    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy,
      take: limit,
      skip: cursor ? 0 : offset,
      // Don't skip if using cursor
      select: {
        id: true,
        content: true,
        role: true,
        createdAt: true
      }
    });
    const totalCount = await prisma.message.count({
      where: { sessionId }
    });
    const hasMore = messages.length === limit;
    const nextCursor = hasMore && messages.length > 0 ? messages[messages.length - 1].createdAt.toISOString() : null;
    return {
      success: true,
      // Reverse to show oldest-to-newest in UI (since we fetched desc)
      data: messages.map((message) => {
        let parsedContent = message.content;
        try {
          const parsed = JSON.parse(message.content);
          if (parsed.type === "multimodal") {
            parsedContent = parsed;
          }
        } catch {
        }
        return {
          id: message.id,
          content: parsedContent,
          role: message.role,
          createdAt: message.createdAt.toISOString()
        };
      }).reverse(),
      pagination: {
        total: totalCount,
        limit,
        offset: cursor ? null : offset,
        cursor: nextCursor,
        hasMore
      }
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    if (error.code === "P1001" || error.code === "P1002" || error.code === "P1017") {
      throw createError({
        statusCode: 503,
        statusMessage: "Database connection error. Please try again later."
      });
    }
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      throw createError({
        statusCode: 503,
        statusMessage: "Network error. Please check your connection."
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error"
    });
  }
});

export { messages_get as default };
//# sourceMappingURL=messages.get.mjs.map
