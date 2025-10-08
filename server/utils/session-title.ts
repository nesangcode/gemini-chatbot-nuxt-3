import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'

export type AutoRenameSummary = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export class AutoRenameError extends Error {
  code: 'SESSION_NOT_FOUND' | 'NO_MESSAGES'

  constructor(code: 'SESSION_NOT_FOUND' | 'NO_MESSAGES', message?: string) {
    super(message ?? code)
    this.name = 'AutoRenameError'
    this.code = code
  }
}

const MAX_TITLE_LENGTH = 50

function extractMessageSummary(content: string) {
  if (!content) {
    return { text: '', attachmentCount: 0 }
  }

  try {
    const parsed = JSON.parse(content) as {
      type?: string
      text?: string
      images?: Array<{ data?: string }>
    }

    if (parsed?.type === 'multimodal') {
      const text = typeof parsed.text === 'string' ? parsed.text : ''
      const attachmentCount = Array.isArray(parsed.images)
        ? parsed.images.filter((image) => typeof image?.data === 'string' && image.data && image.data.length > 0).length
        : 0
      return { text, attachmentCount }
    }
  } catch (error) {
    // ignore parse errors and fall back to plain text
  }

  return { text: content, attachmentCount: 0 }
}

function buildConversationContext(messages: Prisma.MessageGetPayload<{ select: { role: true; content: true } }>[]): string {
  return messages
    .map((message) => {
      const { text, attachmentCount } = extractMessageSummary(message.content)
      const attachmentSuffix = attachmentCount > 0 ? ` [${attachmentCount} gambar]` : ''
      const baseText =
        text.trim().length > 0
          ? text
          : attachmentCount > 0
            ? '(pengguna mengunggah gambar)'
            : ''
      return `${message.role}: ${baseText}${attachmentSuffix}`
    })
    .join('\n')
}

function sanitizeGeneratedTitle(rawTitle: string): string {
  let title = rawTitle.trim().replace(/^["']|["']$/g, '')

  if (!title || title.length < 3) {
    title = `Percakapan ${new Date().toLocaleDateString('id-ID')}`
  }

  if (title.length > MAX_TITLE_LENGTH) {
    title = title.slice(0, MAX_TITLE_LENGTH)
  }

  return title
}

export async function autoRenameSession(params: {
  sessionId: string
  apiKey: string
  userId?: string
}): Promise<AutoRenameSummary> {
  const { sessionId, apiKey, userId } = params

  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      ...(userId ? { userId } : {})
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 10,
        select: {
          role: true,
          content: true,
          createdAt: true
        }
      }
    }
  })

  if (!session) {
    throw new AutoRenameError('SESSION_NOT_FOUND')
  }

  if (session.messages.length === 0) {
    throw new AutoRenameError('NO_MESSAGES')
  }

  const google = createGoogleGenerativeAI({ apiKey })
  const conversationContext = buildConversationContext(session.messages)

  const { text } = await generateText({
    model: google('gemini-2.5-pro'),
    prompt: `Buat judul singkat (maks 50 karakter) yang menggambarkan percakapan berikut. Hanya kembalikan judul saja tanpa tanda kutip atau penjelasan tambahan.\n\n${conversationContext}`,
    temperature: 0.4
  })

  const newTitle = sanitizeGeneratedTitle(text ?? '')

  const [updatedSession, latestMessage] = await prisma.$transaction([
    prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: newTitle }
    }),
    prisma.message.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })
  ])

  const lastActivity = latestMessage?.createdAt ?? updatedSession.createdAt

  return {
    id: updatedSession.id,
    title: updatedSession.title,
    createdAt: updatedSession.createdAt.toISOString(),
    updatedAt: lastActivity.toISOString()
  }
}




