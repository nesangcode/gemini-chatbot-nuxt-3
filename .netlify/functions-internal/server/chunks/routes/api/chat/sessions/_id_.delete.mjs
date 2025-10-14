import { d as defineEventHandler, f as requireAuth, l as getRouterParam, e as createError, p as prisma } from '../../../../_/nitro.mjs';
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

const _id__delete = defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const sessionId = getRouterParam(event, "id");
    if (!sessionId) {
      throw createError({
        statusCode: 400,
        message: "Session ID is required"
      });
    }
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { userId: true }
    });
    if (!session) {
      throw createError({
        statusCode: 404,
        message: "Chat session not found"
      });
    }
    if (session.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: "You are not allowed to delete this chat session."
      });
    }
    await prisma.chatSession.delete({
      where: { id: sessionId }
    });
    return {
      success: true,
      message: "Chat session deleted successfully"
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error"
    });
  }
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
