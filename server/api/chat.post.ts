import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { prisma } from '~/lib/prisma';
import { requireAuth } from '../utils/auth';

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
      const transformedMessages = messages.map((msg: any) => ({
        role: msg.role,
        content: msg.parts?.[0]?.text || msg.content || '',
      }));

      console.log(`[Chat API] Processing ${messages.length} messages for user ${user.id}`);

      const result = await streamText({
        model: google('gemini-2.0-flash'),
        messages: transformedMessages,
        async onFinish({ text, toolCalls, toolResults }) {
          try {
            const lastUserMessage = messages[messages.length - 1];
            const userMessageContent = lastUserMessage.parts?.[0]?.text || lastUserMessage.content || '';

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
          } catch (error) {
            console.error('[Chat API] Error saving messages to database:', error);
            // Don't throw here - we still want to return the AI response even if DB save fails
          }
        },
      });

      return result.toTextStreamResponse();
    } catch (error: any) {
      console.error('[Chat API] Error processing chat request:', error);
      
      // Handle specific error types
      if (error.statusCode) {
        throw error; // Re-throw createError errors
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
