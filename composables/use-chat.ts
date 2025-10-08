import { ref } from 'vue'
import { generateId } from 'ai'

export type ChatMessageRole = 'user' | 'assistant'

export interface ChatImageAttachment {
  type: 'image'
  data?: string
  mimeType?: string
  name?: string
  size?: number
  previewUrl?: string
  id?: string
}

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  content: string
  attachments?: ChatImageAttachment[]
}

export interface AppendOptions {
  body?: Record<string, unknown>
}

export interface UseChatOptions {
  api?: string
  initialMessages?: ChatMessage[]
}

function cloneAttachments(attachments?: ChatImageAttachment[]) {
  return attachments?.map((attachment) => ({ ...attachment }))
}

function sanitizeAttachments(attachments?: ChatImageAttachment[]) {
  if (!Array.isArray(attachments)) {
    return undefined
  }

  const sanitized = attachments
    .filter((attachment) => attachment?.type === 'image' && typeof attachment.data === 'string' && attachment.data && typeof attachment.mimeType === 'string' && attachment.mimeType)
    .map((attachment) => ({
      type: 'image' as const,
      data: attachment.data,
      mimeType: attachment.mimeType,
      id: typeof attachment.id === 'string' ? attachment.id : undefined,
      name: typeof attachment.name === 'string' ? attachment.name : undefined,
      size: typeof attachment.size === 'number' ? attachment.size : undefined
    }))

  return sanitized.length > 0 ? sanitized : undefined

}

export function useChat({ api = '/api/chat/message', initialMessages = [] }: UseChatOptions = {}) {
  const messages = ref<ChatMessage[]>([...initialMessages])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const abortController = ref<AbortController | null>(null)

  const setMessages = (next: ChatMessage[]) => {
    messages.value = [...next]
  }

  const stop = () => {
    abortController.value?.abort()
    abortController.value = null
    isLoading.value = false
  }

  const append = async (
    message: ChatMessage,
    options: AppendOptions = {}
  ): Promise<{ assistantId: string }> => {
    const previousMessages = [...messages.value]
    const assistantId = generateId()
    const controller = new AbortController()
    abortController.value?.abort()
    abortController.value = controller
    isLoading.value = true
    error.value = null

    const payloadMessages = [...previousMessages, message].map(({ id, role, content, attachments }) => ({
      id,
      role,
      content,
      attachments: sanitizeAttachments(attachments)
    }))

    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: ''
    }

    messages.value = [
      ...previousMessages,
      {
        ...message,
        attachments: cloneAttachments(message.attachments)
      },
      assistantPlaceholder
    ]

    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...options.body,
          messages: payloadMessages
        }),
        signal: controller.signal
      })

      if (!response.ok || !response.body) {
        throw new Error('Gagal mengirim pesan')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const segments = buffer.split('\n\n')
        buffer = segments.pop() ?? ''

        for (const segment of segments) {
          const line = segment.trim()
          if (!line) {
            continue
          }

          if (line.startsWith('data:')) {
            const payload = line.slice(5).trim()
            if (!payload || payload === '[DONE]') {
              continue
            }

            try {
              const parsed = JSON.parse(payload) as { content?: string }
              if (typeof parsed.content === 'string') {
                assistantPlaceholder.content += parsed.content
              }
            } catch (parseError) {
              console.warn('Gagal mengurai chunk streaming', parseError)
            }
          }
        }

        messages.value = [
          ...previousMessages,
          {
            ...message,
            attachments: cloneAttachments(message.attachments)
          },
          { ...assistantPlaceholder }
        ]
      }

      return { assistantId }
    } catch (fetchError) {
      if ((fetchError as Error).name === 'AbortError') {
        return { assistantId }
      }

      error.value = fetchError as Error
      messages.value = [...previousMessages]
      throw fetchError
    } finally {
      if (abortController.value === controller) {
        abortController.value = null
      }
      isLoading.value = false
    }
  }

  return {
    messages,
    isLoading,
    error,
    append,
    setMessages,
    stop
  }
}
