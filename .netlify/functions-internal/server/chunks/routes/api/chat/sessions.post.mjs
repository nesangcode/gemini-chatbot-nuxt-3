import { d as defineEventHandler, f as requireAuth, r as readBody, p as prisma, e as createError } from '../../../_/nitro.mjs';
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

const sessions_post = defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const body = await readBody(event).catch(() => ({}));
    const model = (body == null ? void 0 : body.model) || "gemini-2.5-flash";
    const newSession = await prisma.chatSession.create({
      data: {
        userId: user.id,
        model
      }
    });
    return {
      success: true,
      data: {
        id: newSession.id,
        title: newSession.title,
        model: newSession.model,
        createdAt: newSession.createdAt.toISOString(),
        updatedAt: newSession.createdAt.toISOString()
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

export { sessions_post as default };
//# sourceMappingURL=sessions.post.mjs.map
