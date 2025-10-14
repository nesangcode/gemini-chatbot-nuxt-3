import { d as defineEventHandler, f as requireAuth, l as getRouterParam, r as readBody, e as createError, p as prisma } from '../../../../../_/nitro.mjs';
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

const model_patch = defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const sessionId = getRouterParam(event, "id");
    const body = await readBody(event);
    const { model } = body;
    if (!sessionId) {
      throw createError({
        statusCode: 400,
        message: "Session ID is required"
      });
    }
    if (!model || typeof model !== "string") {
      throw createError({
        statusCode: 400,
        message: "Model is required and must be a string"
      });
    }
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { userId: true }
    });
    if (!session || session.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: "You are not allowed to access this chat session."
      });
    }
    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: { model },
      select: {
        id: true,
        title: true,
        model: true,
        createdAt: true
      }
    });
    return {
      success: true,
      data: {
        id: updatedSession.id,
        title: updatedSession.title,
        model: updatedSession.model,
        createdAt: updatedSession.createdAt.toISOString()
      }
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

export { model_patch as default };
//# sourceMappingURL=model.patch.mjs.map
