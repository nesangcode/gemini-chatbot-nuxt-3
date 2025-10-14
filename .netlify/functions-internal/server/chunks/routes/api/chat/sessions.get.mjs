import { d as defineEventHandler, f as requireAuth, k as getQuery, p as prisma, e as createError } from '../../../_/nitro.mjs';
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

const sessions_get = defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const query = getQuery(event);
    const limit = query.limit ? parseInt(query.limit) : 20;
    const cursor = query.cursor ? query.cursor : null;
    const whereClause = { userId: user.id };
    if (cursor) {
      try {
        const [timestamp, lastId] = cursor.split("_");
        whereClause.OR = [
          { updatedAt: { lt: new Date(timestamp) } },
          {
            AND: [
              { updatedAt: new Date(timestamp) },
              { id: { lt: lastId } }
            ]
          }
        ];
      } catch (e) {
      }
    }
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
        { updatedAt: "desc" },
        // Primary: Sort by last update time descending
        { id: "desc" }
        // Secondary: Ensure consistent order for same timestamp
      ],
      take: limit + 1
      // Fetch one extra to check if there are more
    });
    const hasMore = rawSessions.length > limit;
    const sessionsToReturn = hasMore ? rawSessions.slice(0, limit) : rawSessions;
    const sessions = sessionsToReturn.map((session) => ({
      id: session.id,
      title: session.title,
      model: session.model,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString()
    }));
    const nextCursor = sessions.length > 0 ? `${sessions[sessions.length - 1].updatedAt}_${sessions[sessions.length - 1].id}` : null;
    return {
      success: true,
      data: sessions,
      pagination: {
        limit,
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

export { sessions_get as default };
//# sourceMappingURL=sessions.get.mjs.map
