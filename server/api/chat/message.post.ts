import { randomUUID } from 'node:crypto'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText } from 'ai'
import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../utils/auth'
import { autoRenameSession, AutoRenameError } from '../../utils/session-title'

type ImageAttachmentPayload = {
  type?: string
  data?: string
  mimeType?: string
  name?: string
  size?: number
  id?: string
}

type SanitizedAttachment = {
  id: string
  data: string
  mimeType: string
  name?: string
  size?: number
}

type StoredMultimodalPayload = {
  type?: string
  text?: string
  images?: Array<{
    id?: string
    data?: string
    mimeType?: string
    name?: string
    size?: number
  }>
}
type ChatMessagePayload = {
  id?: string
  role?: string
  content?: string
  attachments?: ImageAttachmentPayload[]
}

function sanitizeIncomingAttachments(attachments?: ImageAttachmentPayload[]): SanitizedAttachment[] {
  if (!Array.isArray(attachments)) {
    return []
  }

  return attachments
    .filter((attachment) => {
      if (!attachment) {
        return false
      }
      const hasValidType = !attachment.type || attachment.type === 'image'
      const hasData = typeof attachment.data === 'string' && attachment.data.trim().length > 0
      const hasMimeType = typeof attachment.mimeType === 'string' && attachment.mimeType.trim().length > 0
      return hasValidType && hasData && hasMimeType
    })
    .map((attachment) => ({
      id:
        typeof attachment.id === 'string' && attachment.id.trim().length > 0
          ? attachment.id.trim()
          : randomUUID(),
      data: attachment.data!.trim(),
      mimeType: attachment.mimeType!.trim(),
      name: typeof attachment.name === 'string' && attachment.name.trim().length > 0 ? attachment.name.trim() : undefined,
      size:
        typeof attachment.size === 'number' && Number.isFinite(attachment.size) ? attachment.size : undefined
    }))
}

function serializeMessageContent(text: string, attachments: SanitizedAttachment[]): string {
  const normalizedText = typeof text === 'string' ? text : ''
  if (attachments.length === 0) {
    return normalizedText
  }

  const payload: StoredMultimodalPayload = {
    type: 'multimodal',
    text: normalizedText,
    images: attachments.map(({ id, data, mimeType, name, size }) => ({
      id,
      data,
      mimeType,
      name,
      size
    }))
  }

  return JSON.stringify(payload)
}

function parseStoredMessageContent(raw: string | null | undefined): { text: string; attachments: SanitizedAttachment[] } {
  if (!raw) {
    return { text: '', attachments: [] }
  }

  try {
    const parsed = JSON.parse(raw) as StoredMultimodalPayload
    if (parsed?.type === 'multimodal') {
      const text = typeof parsed.text === 'string' ? parsed.text : ''
      const attachments = sanitizeIncomingAttachments(parsed.images)
      return { text, attachments }
    }
  } catch (error) {
    // ignore parse errors and fall back to plain text
  }

  return { text: raw, attachments: [] }
}

function buildUserProviderContent(text: string, attachments: SanitizedAttachment[]) {
  if (attachments.length === 0) {
    return text
  }

  const parts: Array<{ type: 'text'; text: string } | { type: 'image'; image: string; mediaType: string }> = []

  if (text) {
    parts.push({ type: 'text', text })
  }

  for (const attachment of attachments) {
    parts.push({ type: 'image', image: attachment.data, mediaType: attachment.mimeType })
  }

  return parts
}
type ChatRequestBody = {
  sessionId?: string
  messages?: ChatMessagePayload[]
  message?: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = (await readBody(event)) as ChatRequestBody
    const { sessionId } = body

    if (!sessionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Session ID is required'
      })
    }

    let chatMessages = Array.isArray(body.messages) ? body.messages : []

    if (chatMessages.length === 0 && body.message) {
      chatMessages = [
        {
          id: randomUUID(),
          role: 'user',
          content: body.message
        }
      ]
    }

    if (!Array.isArray(chatMessages) || chatMessages.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Messages payload is required'
      })
    }

    const latestUserMessage = [...chatMessages].reverse().find((message) => message.role === 'user')

    const latestUserText = typeof latestUserMessage?.content === 'string' ? latestUserMessage.content : ''
    const latestUserAttachments = sanitizeIncomingAttachments(latestUserMessage?.attachments)
    const normalizedUserText = latestUserText.trim()

    if (!normalizedUserText && latestUserAttachments.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A user message is required to continue the chat'
      })
    }

    const serializedContent = serializeMessageContent(normalizedUserText, latestUserAttachments)

    const user = await requireAuth(event)

    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id
      }
    })

    if (!session) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Session not found'
      })
    }

    const runtimeConfig = useRuntimeConfig()
    const apiKey = runtimeConfig.geminiApiKey

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Gemini API key not configured'
      })
    }

    const google = createGoogleGenerativeAI({ apiKey })

    const existingMessages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    })

    const shouldAutoRename = existingMessages.length === 0 && session.title === 'New Chat'

    if (latestUserMessage.id) {
      const alreadyStored = existingMessages.some((message) => message.id === latestUserMessage.id)

      if (!alreadyStored) {
        await prisma.message.create({
          data: {
            id: latestUserMessage.id,
            sessionId,
            content: serializedContent,
            role: 'user'
          }
        })
      }
    } else {
      await prisma.message.create({
        data: {
          sessionId,
          content: serializedContent,
          role: 'user'
        }
      })
    }

    const conversation = [
      ...existingMessages.map((message) => {
        const parsed = parseStoredMessageContent(message.content)

        if (message.role === 'assistant') {
          return {
            role: 'assistant' as const,
            content: parsed.text
          }
        }

        return {
          role: 'user' as const,
          content: buildUserProviderContent(parsed.text, parsed.attachments)
        }
      }),
      {
        role: 'user' as const,
        content: buildUserProviderContent(normalizedUserText, latestUserAttachments)
      }
    ]

    const result = await streamText({
      model: google('gemini-2.5-pro'),
      messages: conversation,
      temperature: 0.7,
      onFinish: async ({ text }) => {
        const trimmed = text.trim()

        if (trimmed.length > 0) {
          await prisma.message.create({
            data: {
              sessionId,
              content: trimmed,
              role: 'assistant'
            }
          })
        }

        if (shouldAutoRename) {
          try {
            await autoRenameSession({ sessionId, apiKey, userId: user.id })
          } catch (renameError) {
            if (!(renameError instanceof AutoRenameError) || renameError.code !== 'NO_MESSAGES') {
              console.error('Failed to auto rename session:', renameError)
            }
          }
        }
      }
    })

    const textReader = result.textStream.getReader()
    const encoder = new TextEncoder()
    let cancelled = false

    // Convert Gemini plain text stream into SSE chunks for the client with a human-typing cadence
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
        const randomDelay = (min: number, max: number) =>
          Math.floor(Math.random() * (max - min + 1)) + min
        const typingDelayFor = (char: string) => {
          if (char === '\n' || char === '\r') {
            return randomDelay(180, 260)
          }
          if (char === ' ') {
            return randomDelay(18, 35)
          }
          if ('.?!'.includes(char)) {
            return randomDelay(200, 320)
          }
          if (',;:'.includes(char)) {
            return randomDelay(150, 240)
          }
          return randomDelay(12, 28)
        }

        try {
          while (!cancelled) {
            const { done, value } = await textReader.read()

            if (done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
              break
            }

            if (typeof value !== 'string' || value.length === 0) {
              continue
            }

            for (const char of value) {
              if (cancelled) {
                break
              }
              if (char === '\r') {
                continue
              }

              const payload = `data: ${JSON.stringify({ content: char })}`
              controller.enqueue(encoder.encode(`${payload}\n\n`))

              const delay = typingDelayFor(char)
              if (delay > 0) {
                await sleep(delay)
              }
            }

            if (cancelled) {
              break
            }
          }
        } catch (streamError) {
          controller.error(streamError)
        } finally {
          textReader.releaseLock()
        }
      },
      cancel(reason) {
        cancelled = true
        textReader.cancel(reason).catch(() => {})
      }
    })

    const response = new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked"
      }
    })

    for (const [key, value] of response.headers) {
      setHeader(event, key, value)
    }

    return response
  } catch (error: any) {
    console.error('Error in chat message handler:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})






