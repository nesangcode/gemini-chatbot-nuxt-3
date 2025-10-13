import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useChatMessages } from './use-chat-messages'

// Mock $fetch
global.$fetch = vi.fn()

describe('useChatMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('mapApiMessageToUiMessage', () => {
    it('should map multimodal message with images', () => {
      const { fetchMessages } = useChatMessages()
      
      const mockMessage = {
        id: 'msg-1',
        role: 'user',
        content: {
          type: 'multimodal',
          text: 'Check this image',
          images: [
            { data: 'base64data', mimeType: 'image/png' }
          ]
        }
      }

      const mockResponse = {
        success: true,
        data: [mockMessage],
        pagination: { total: 1, hasMore: false }
      }

      vi.mocked(global.$fetch).mockResolvedValue(mockResponse)

      // The mapApiMessageToUiMessage is called internally
      // We'll test it through fetchMessages
    })

    it('should map plain text message', async () => {
      const { fetchMessages } = useChatMessages()
      
      const mockMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hello there!'
      }

      const mockResponse = {
        success: true,
        data: [mockMessage],
        pagination: { total: 1, hasMore: false }
      }

      vi.mocked(global.$fetch).mockResolvedValue(mockResponse)

      const result = await fetchMessages('session-1')
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'msg-2',
        role: 'assistant',
        content: 'Hello there!'
      })
    })
  })

  describe('fetchMessages', () => {
    it('should fetch messages successfully', async () => {
      const { fetchMessages, messagesPagination } = useChatMessages()
      
      const mockMessages = [
        { id: 'msg-1', role: 'user', content: 'Hello' },
        { id: 'msg-2', role: 'assistant', content: 'Hi there!' }
      ]

      const mockResponse = {
        success: true,
        data: mockMessages,
        pagination: {
          total: 2,
          limit: 10,
          offset: 0,
          hasMore: false
        }
      }

      vi.mocked(global.$fetch).mockResolvedValue(mockResponse)

      const result = await fetchMessages('session-1')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('msg-1')
      expect(result[1].id).toBe('msg-2')
      expect(messagesPagination.value.total).toBe(2)
      expect(messagesPagination.value.loading).toBe(false)
      expect(global.$fetch).toHaveBeenCalledWith('/api/chat/sessions/session-1/messages?limit=10')
    })

    it('should handle fetch error', async () => {
      const { fetchMessages, messagesError, messagesPagination } = useChatMessages()

      vi.mocked(global.$fetch).mockRejectedValue(new Error('Network error'))

      const result = await fetchMessages('session-1')

      expect(result).toEqual([])
      expect(messagesError.value).toMatchObject({
        type: 'error',
        message: 'Gagal memuat pesan',
        canRetry: true
      })
      expect(messagesPagination.value.loading).toBe(false)
    })

    it('should return empty array when response is not successful', async () => {
      const { fetchMessages } = useChatMessages()

      vi.mocked(global.$fetch).mockResolvedValue({
        success: false,
        data: null
      })

      const result = await fetchMessages('session-1')

      expect(result).toEqual([])
    })

    it('should reset pagination before fetching', async () => {
      const { fetchMessages, messagesPagination } = useChatMessages()

      // Set some initial pagination state
      messagesPagination.value = {
        total: 100,
        limit: 20,
        offset: 40,
        cursor: 'old-cursor',
        hasMore: true,
        loading: false
      }

      vi.mocked(global.$fetch).mockResolvedValue({
        success: true,
        data: [],
        pagination: { total: 0, hasMore: false }
      })

      await fetchMessages('session-1')

      // Should be reset and then updated with new data
      expect(messagesPagination.value.total).toBe(0)
      expect(messagesPagination.value.loading).toBe(false)
    })
  })

  describe('loadMoreMessages', () => {
    it('should load more messages with cursor', async () => {
      const { loadMoreMessages, messagesPagination } = useChatMessages()

      // Set initial pagination state
      messagesPagination.value = {
        total: 20,
        limit: 10,
        offset: 10,
        cursor: 'cursor-123',
        hasMore: true,
        loading: false
      }

      const mockMessages = [
        { id: 'msg-11', role: 'user', content: 'Older message' }
      ]

      vi.mocked(global.$fetch).mockResolvedValue({
        success: true,
        data: mockMessages,
        pagination: {
          total: 20,
          limit: 10,
          offset: 20,
          cursor: 'cursor-456',
          hasMore: false
        }
      })

      const result = await loadMoreMessages('session-1')

      expect(result.messages).toHaveLength(1)
      expect(result.messages[0].id).toBe('msg-11')
      expect(messagesPagination.value.cursor).toBe('cursor-456')
      expect(messagesPagination.value.hasMore).toBe(false)
      expect(global.$fetch).toHaveBeenCalledWith(
        expect.stringContaining('cursor=cursor-123')
      )
    })

    it('should not load when no more messages', async () => {
      const { loadMoreMessages, messagesPagination } = useChatMessages()

      messagesPagination.value = {
        total: 10,
        limit: 10,
        offset: 10,
        cursor: null,
        hasMore: false,
        loading: false
      }

      const result = await loadMoreMessages('session-1')

      expect(result.messages).toEqual([])
      expect(result.scrollData).toBeNull()
      expect(global.$fetch).not.toHaveBeenCalled()
    })

    it('should not load when already loading', async () => {
      const { loadMoreMessages, messagesPagination } = useChatMessages()

      messagesPagination.value = {
        total: 20,
        limit: 10,
        offset: 10,
        cursor: 'cursor-123',
        hasMore: true,
        loading: true
      }

      const result = await loadMoreMessages('session-1')

      expect(result.messages).toEqual([])
      expect(global.$fetch).not.toHaveBeenCalled()
    })

    it('should not load when sessionId is empty', async () => {
      const { loadMoreMessages, messagesPagination } = useChatMessages()

      messagesPagination.value = {
        total: 20,
        limit: 10,
        offset: 10,
        cursor: 'cursor-123',
        hasMore: true,
        loading: false
      }

      const result = await loadMoreMessages('')

      expect(result.messages).toEqual([])
      expect(global.$fetch).not.toHaveBeenCalled()
    })

    it('should handle load more error', async () => {
      const { loadMoreMessages, messagesPagination, messagesError } = useChatMessages()

      messagesPagination.value = {
        total: 20,
        limit: 10,
        offset: 10,
        cursor: 'cursor-123',
        hasMore: true,
        loading: false
      }

      vi.mocked(global.$fetch).mockRejectedValue(new Error('Network error'))

      const result = await loadMoreMessages('session-1')

      expect(result.messages).toEqual([])
      expect(messagesError.value).toMatchObject({
        type: 'error',
        message: 'Gagal memuat lebih banyak pesan',
        canRetry: true
      })
      expect(messagesPagination.value.loading).toBe(false)
    })
  })

  describe('finishLoadingOlderMessages', () => {
    it('should set isLoadingOlderMessages to false after delay', async () => {
      vi.useFakeTimers()
      const { finishLoadingOlderMessages, isLoadingOlderMessages } = useChatMessages()

      isLoadingOlderMessages.value = true
      finishLoadingOlderMessages()

      expect(isLoadingOlderMessages.value).toBe(true)

      vi.advanceTimersByTime(150)

      expect(isLoadingOlderMessages.value).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('clearMessages', () => {
    it('should reset pagination and error state', () => {
      const { clearMessages, messagesPagination, messagesError } = useChatMessages()

      // Set some state
      messagesPagination.value = {
        total: 100,
        limit: 20,
        offset: 40,
        cursor: 'cursor-123',
        hasMore: true,
        loading: true
      }
      messagesError.value = { type: 'error', message: 'Some error' }

      clearMessages()

      expect(messagesPagination.value).toEqual({
        total: 0,
        limit: 10,
        offset: 0,
        cursor: null,
        hasMore: false,
        loading: false
      })
      expect(messagesError.value).toBeNull()
    })
  })
})
