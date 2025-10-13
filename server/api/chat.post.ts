import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { prisma } from '~/lib/prisma';
import { requireAuth } from '../utils/auth';
import { autoRenameSession } from '../utils/session-title';

export default defineLazyEventHandler(async () => {
  const runtimeConfig = useRuntimeConfig();
  
  // Validate API key exists
  if (!runtimeConfig.geminiApiKey) {
    console.error('[Chat API] GEMINI_API_KEY is not configured');
    throw createError({
      statusCode: 500,
      message: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.',
    });
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
        select: { id: true, userId: true },
      });

      if (!session || session.userId !== user.id) {
        throw createError({
          statusCode: 403,
          message: 'You are not allowed to access this chat session.',
        });
      }

      // Transform messages from @ai-sdk/vue format to AI SDK message format
      const transformedMessages = messages.map((msg: any) => {
        // Check if this is a multimodal message with content array
        if (msg.content && Array.isArray(msg.content)) {
          // Content is already in multimodal format (array of parts)
          return {
            role: msg.role,
            content: msg.content
          };
        }
        
        // Text-only message - extract text from various possible formats
        const textContent = msg.text || msg.parts?.[0]?.text || msg.content || '';
        return {
          role: msg.role,
          content: textContent,
        };
      });

      // Limit to last 20 messages to optimize API usage
      const limitedMessages = transformedMessages.slice(-20);

      console.log(`[Chat API] Processing ${limitedMessages.length} of ${messages.length} messages for user ${user.id}`);

      let result;
      try {
        result = await streamText({
          model: google('gemini-2.0-flash'),
          messages: limitedMessages,
          async onFinish({ text, toolCalls, toolResults }) {
            try {
              const lastUserMessage = messages[messages.length - 1];
              const hasImages = body?.hasImages || false;
              const images = body?.images || [];
              
              // Extract user message content
              let userMessageContent: string;
              
              if (hasImages && images.length > 0) {
                // Get text content from multimodal message
                let textContent = '';
                if (Array.isArray(lastUserMessage.content)) {
                  const textPart = lastUserMessage.content.find((part: any) => part.type === 'text');
                  textContent = textPart?.text || '';
                } else {
                  textContent = lastUserMessage.content || '';
                }
                
                // Store as JSON for multimodal content
                userMessageContent = JSON.stringify({
                  type: 'multimodal',
                  text: textContent,
                  images: images.map((img: any) => ({
                    data: img.data,
                    mimeType: img.mimeType || 'image/jpeg'
                  }))
                });
              } else {
                // Plain text - extract from text field or parts
                userMessageContent = lastUserMessage.text || lastUserMessage.parts?.[0]?.text || lastUserMessage.content || '';
              }

              await prisma.message.createMany({
                data: [
                  {
                    content: userMessageContent,
                    role: 'user',
                    sessionId,
                  },
                  {
                    content: text,
                    role: 'assistant',
                    sessionId,
                  },
                ],
              });
              console.log(`[Chat API] Successfully saved messages for user ${user.id}`);
              
              // Check if this is the first message exchange (2 messages total)
              const messageCount = await prisma.message.count({
                where: { sessionId }
              });
              
              // Only auto-rename for text-only first messages
              // Skip auto-rename for multimodal messages to avoid complexity
              if (messageCount === 2 && !hasImages) {
                // Trigger auto-rename in the background for first message
                console.log(`[Chat API] Triggering auto-rename for session ${sessionId}`);
                autoRenameSession({
                  sessionId,
                  userId: user.id,
                  apiKey: runtimeConfig.geminiApiKey
                }).then((result) => {
                  console.log(`[Chat API] Session ${sessionId} auto-renamed to: "${result.title}"`);
                }).catch((error) => {
                  console.error(`[Chat API] Error auto-renaming session ${sessionId}:`, error);
                });
              }
            } catch (error) {
              console.error('[Chat API] Error saving messages to database:', error);
              // Don't throw here - we still want to return the AI response even if DB save fails
            }
          },
        });
      } catch (apiError: any) {
        console.error('[Chat API] Gemini API error:', apiError);
        
        // Handle specific Gemini API errors
        if (apiError.code === 'ENOTFOUND' || apiError.code === 'ECONNREFUSED' || apiError.code === 'ETIMEDOUT') {
          throw createError({
            statusCode: 503,
            message: 'Tidak dapat terhubung ke layanan Gemini AI. Silakan coba lagi nanti.',
          });
        }
        
        if (apiError.status === 429) {
          throw createError({
            statusCode: 429,
            message: 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.',
          });
        }
        
        if (apiError.status === 401 || apiError.status === 403) {
          throw createError({
            statusCode: 500,
            message: 'Konfigurasi API key tidak valid.',
          });
        }
        
        // Generic API error
        throw createError({
          statusCode: 502,
          message: 'Layanan AI sedang tidak tersedia. Silakan coba lagi.',
        });
      }

      return result.toTextStreamResponse();
    } catch (error: any) {
      console.error('[Chat API] Error processing chat request:', error);
      
      // Handle specific error types
      if (error.statusCode) {
        throw error; // Re-throw createError errors
      }

      // Handle network errors
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw createError({
          statusCode: 503,
          message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        });
      }
      
      // Handle API errors
      if (error.message?.includes('API key')) {
        throw createError({
          statusCode: 500,
          message: 'Invalid Gemini API key. Please check your configuration.',
        });
      }

      // Generic error
      throw createError({
        statusCode: 500,
        message: error.message || 'An error occurred while processing your request',
      });
    }
  });
});
