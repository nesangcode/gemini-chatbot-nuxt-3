import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { prisma } from '~/lib/prisma';
import { requireAuth } from '../utils/auth';
import { autoRenameSession } from '../utils/session-title';
import { transformMessage, prepareMessageContent } from '../utils/message-transformer';

export default defineLazyEventHandler(async () => {
  const runtimeConfig = useRuntimeConfig();
  
  if (!runtimeConfig.geminiApiKey) {
    throw createError({
      statusCode: 500,
      message: 'Gemini API key is not configured.',
    })
  }

  const google = createGoogleGenerativeAI({
    apiKey: runtimeConfig.geminiApiKey,
  });

  return defineEventHandler(async (event) => {
    try {
      const body = await readBody(event);
      const messages = body?.messages;
      const sessionId = body?.sessionId ?? body?.data?.sessionId ?? body?.body?.sessionId;
      const user = await requireAuth(event);

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw createError({
          statusCode: 400,
          message: 'Messages array is required and must not be empty',
        });
      }

      if (!sessionId || typeof sessionId !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'Session ID is required to save chat history.',
        });
      }

      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { id: true, userId: true, model: true },
      });

      if (!session || session.userId !== user.id) {
        throw createError({
          statusCode: 403,
          message: 'You are not allowed to access this chat session.',
        });
      }

      // Transform messages to AI SDK format
      const transformedMessages = await Promise.all(messages.map(transformMessage));

      const limitedMessages = transformedMessages.slice(-20)
      console.log(`[Chat API] Processing ${limitedMessages.length} messages`)

      let savedMessageIds: { userMessageId: string; assistantMessageId: string } | null = null
      let result
      try {
        // Use model from session, fallback to default
        const modelName = session.model || 'gemini-2.5-flash'
        console.log(`[Chat API] Using model: ${modelName} for session: ${sessionId}`)
        result = await streamText({
          model: google(modelName),
          messages: limitedMessages,
          async onFinish({ text }) {
            try {
              const lastUserMessage = messages[messages.length - 1]
              const hasImages = body?.hasImages || false
              const hasPdfs = body?.hasPdfs || false
              const images = body?.images || []
              const pdfs = body?.pdfs || []
              
              const userMessageContent = prepareMessageContent(lastUserMessage, hasImages, images, hasPdfs, pdfs)
              
              // Save user message first to maintain order
              const userMessage = await prisma.message.create({
                data: { content: userMessageContent, role: 'user', sessionId }
              })
              
              // Then save assistant message
              const assistantMessage = await prisma.message.create({
                data: { content: text, role: 'assistant', sessionId }
              })
              
              savedMessageIds = {
                userMessageId: userMessage.id,
                assistantMessageId: assistantMessage.id
              }
              
              // Auto-rename for first text-only message
              const messageCount = await prisma.message.count({ where: { sessionId } })
              if (messageCount === 2 && !hasImages && !hasPdfs) {
                autoRenameSession({
                  sessionId,
                  userId: user.id,
                  apiKey: runtimeConfig.geminiApiKey
                }).catch(() => {})
              }
            } catch (error) {
              console.error('[Chat API] Error saving messages:', error)
            }
          },
        });
      } catch (apiError: any) {
        console.error('[Chat API] Gemini API error:', apiError)
        
        if (apiError.code === 'ENOTFOUND' || apiError.code === 'ECONNREFUSED' || apiError.code === 'ETIMEDOUT') {
          throw createError({ statusCode: 503, message: 'Tidak dapat terhubung ke layanan Gemini AI.' })
        }
        if (apiError.status === 429) {
          throw createError({ statusCode: 429, message: 'Terlalu banyak permintaan. Silakan tunggu.' })
        }
        if (apiError.status === 401 || apiError.status === 403) {
          throw createError({ statusCode: 500, message: 'Konfigurasi API key tidak valid.' })
        }
        
        throw createError({ statusCode: 502, message: 'Layanan AI tidak tersedia.' })
      }

      return result.toTextStreamResponse()
    } catch (error: any) {
      console.error('[Chat API] Error:', error)
      
      if (error.statusCode) throw error
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw createError({ statusCode: 503, message: 'Tidak dapat terhubung ke server.' })
      }
      if (error.message?.includes('API key')) {
        throw createError({ statusCode: 500, message: 'Invalid API key.' })
      }

      throw createError({ statusCode: 500, message: error.message || 'Internal server error' })
    }
  });
});
