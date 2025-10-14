import { d as defineEventHandler, f as requireAuth, l as getRouterParam, e as createError, c as useRuntimeConfig, i as autoRenameSession, A as AutoRenameError } from '../../../../../_/nitro.mjs';
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

const rename_post = defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const sessionId = getRouterParam(event, "id");
    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Session ID is required"
      });
    }
    const runtimeConfig = useRuntimeConfig();
    const apiKey = runtimeConfig.geminiApiKey;
    if (!apiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: "Gemini API key not configured"
      });
    }
    try {
      const renamed = await autoRenameSession({
        sessionId,
        userId: user.id,
        apiKey
      });
      return {
        success: true,
        session: renamed
      };
    } catch (renameError) {
      if (renameError instanceof AutoRenameError) {
        if (renameError.code === "SESSION_NOT_FOUND") {
          throw createError({
            statusCode: 404,
            statusMessage: "Session not found"
          });
        }
        if (renameError.code === "NO_MESSAGES") {
          throw createError({
            statusCode: 400,
            statusMessage: "Cannot rename session with no messages"
          });
        }
      }
      throw renameError;
    }
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to rename session"
    });
  }
});

export { rename_post as default };
//# sourceMappingURL=rename.post.mjs.map
