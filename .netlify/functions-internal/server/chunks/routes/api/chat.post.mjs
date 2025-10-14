import { b as defineLazyEventHandler, c as useRuntimeConfig, e as createError, d as defineEventHandler, r as readBody, f as requireAuth, p as prisma, t as transformMessage, h as prepareMessageContent, i as autoRenameSession } from '../../_/nitro.mjs';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
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

const chat_post = defineLazyEventHandler(async () => {
  const runtimeConfig = useRuntimeConfig();
  if (!runtimeConfig.geminiApiKey) {
    throw createError({
      statusCode: 500,
      message: "Gemini API key is not configured."
    });
  }
  const google = createGoogleGenerativeAI({
    apiKey: runtimeConfig.geminiApiKey
  });
  return defineEventHandler(async (event) => {
    var _a, _b, _c, _d, _e;
    try {
      const body = await readBody(event);
      const messages = body == null ? void 0 : body.messages;
      const sessionId = (_d = (_b = body == null ? void 0 : body.sessionId) != null ? _b : (_a = body == null ? void 0 : body.data) == null ? void 0 : _a.sessionId) != null ? _d : (_c = body == null ? void 0 : body.body) == null ? void 0 : _c.sessionId;
      const user = await requireAuth(event);
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw createError({
          statusCode: 400,
          message: "Messages array is required and must not be empty"
        });
      }
      const cleanedMessages = messages.map((msg) => {
        if (msg.parts && Array.isArray(msg.parts)) {
          const contentParts = msg.parts.filter(
            (part) => part.type !== "step-start" && part.type !== "step-finish"
          );
          return { ...msg, parts: contentParts };
        }
        if (Array.isArray(msg.content)) {
          const contentParts = msg.content.filter(
            (part) => part.type !== "step-start" && part.type !== "step-finish"
          );
          return { ...msg, content: contentParts };
        }
        return msg;
      });
      if (!sessionId || typeof sessionId !== "string") {
        throw createError({
          statusCode: 400,
          message: "Session ID is required to save chat history."
        });
      }
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { id: true, userId: true, model: true }
      });
      if (!session || session.userId !== user.id) {
        throw createError({
          statusCode: 403,
          message: "You are not allowed to access this chat session."
        });
      }
      const transformedMessages = await Promise.all(cleanedMessages.map(transformMessage));
      const filteredMessages = transformedMessages.filter((msg) => {
        if (typeof msg.content === "string") {
          return msg.content.trim().length > 0;
        }
        if (Array.isArray(msg.content)) {
          return msg.content.some((part) => {
            var _a2;
            if (part.type === "text") return ((_a2 = part.text) == null ? void 0 : _a2.trim().length) > 0;
            return true;
          });
        }
        return true;
      });
      const limitedMessages = filteredMessages.slice(-20);
      let savedMessageIds = null;
      let result;
      try {
        const modelName = session.model || "gemini-2.5-flash";
        result = await streamText({
          model: google(modelName),
          messages: limitedMessages,
          async onFinish({ text }) {
            try {
              const lastUserMessage = cleanedMessages[cleanedMessages.length - 1];
              const hasImages = (body == null ? void 0 : body.hasImages) || false;
              const hasPdfs = (body == null ? void 0 : body.hasPdfs) || false;
              const images = (body == null ? void 0 : body.images) || [];
              const pdfs = (body == null ? void 0 : body.pdfs) || [];
              const userMessageContent = prepareMessageContent(lastUserMessage, hasImages, images, hasPdfs, pdfs);
              const userMessage = await prisma.message.create({
                data: { content: userMessageContent, role: "user", sessionId }
              });
              const assistantMessage = await prisma.message.create({
                data: { content: text, role: "assistant", sessionId }
              });
              await prisma.chatSession.update({
                where: { id: sessionId },
                data: { updatedAt: /* @__PURE__ */ new Date() }
              });
              savedMessageIds = {
                userMessageId: userMessage.id,
                assistantMessageId: assistantMessage.id
              };
              const messageCount = await prisma.message.count({ where: { sessionId } });
              if (messageCount === 2 && !hasImages && !hasPdfs) {
                try {
                  await autoRenameSession({
                    sessionId,
                    userId: user.id,
                    apiKey: runtimeConfig.geminiApiKey
                  });
                } catch (error) {
                }
              }
            } catch (error) {
            }
          }
        });
      } catch (apiError) {
        if (apiError.code === "ENOTFOUND" || apiError.code === "ECONNREFUSED" || apiError.code === "ETIMEDOUT") {
          throw createError({ statusCode: 503, message: "Tidak dapat terhubung ke layanan Gemini AI." });
        }
        if (apiError.status === 429) {
          throw createError({ statusCode: 429, message: "Terlalu banyak permintaan. Silakan tunggu." });
        }
        if (apiError.status === 401 || apiError.status === 403) {
          throw createError({ statusCode: 500, message: "Konfigurasi API key tidak valid." });
        }
        throw createError({ statusCode: 502, message: "Layanan AI tidak tersedia." });
      }
      return result.toTextStreamResponse();
    } catch (error) {
      if (error.statusCode) throw error;
      if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        throw createError({ statusCode: 503, message: "Tidak dapat terhubung ke server." });
      }
      if ((_e = error.message) == null ? void 0 : _e.includes("API key")) {
        throw createError({ statusCode: 500, message: "Invalid API key." });
      }
      throw createError({ statusCode: 500, message: error.message || "Internal server error" });
    }
  });
});

export { chat_post as default };
//# sourceMappingURL=chat.post.mjs.map
