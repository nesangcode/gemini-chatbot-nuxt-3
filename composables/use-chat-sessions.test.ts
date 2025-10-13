import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useChatSessions } from './use-chat-sessions'

// Mock $fetch
global.$fetch = vi.fn()

describe('useChatSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchChatSessions', () => {
    it('should fetch chat sessions successfully', async () => {
      const { fetchChatSessions, chatSessions, sessionsPagination } = useChatSessions()

      const mockSessions = [
        { id: 'session-1', title: 'Chat 1', createdAt: '2024-01-01' },
        { id: 'session-2', title: 'Chat 2', createdAt: '2024-01-02' }
      ]

      const mockResponse = {
        success: true,
        data: mockSessions,
        pagination: {
          limit: 20,
          cursor: 'cursor-123',
          hasMore: true
        }
      }

      vi.mocked(global.$fetch).mockResolvedValue(mockResponse)

      await fetchChatSessions()

      expect(chatSessions.value).toEqual(mockSessions)
      expect(sessionsPagination.value.hasMore).toBe(true)
      expect(sessionsPagination.value.cursor).toBe('cursor-123')
      expect(sessionsPagination.value.loading).toBe(false)
    })

    it('should refresh sessions and reset cursor', async () => {
      const { fetchChatSessions, sessionsPagination } = useChatSessions()

      // Set initial cursor
      sessionsPagination.value.cursor = 'old-cursor'

      const mockResponse = {
        success: true,
        data: [],
        pagination: {
          limit: 20,
          cursor: 'new-cursor',
          hasMore: false
        }
      }

      vi.mocked(global.$fetch).mockResolvedValue(mockResponse)

      await fetchChatSessions(true)

      expect(global.$fetch).toHaveBeenCalledWith('/api/chat/sessions', {
        params: {
          limit: 20,
          cursor: undefined
        }
      })
      expect(sessionsPagination.value.cursor).toBe('new-cursor')
    })

    it('should update currentSession if it exists in fetched data', async () => {
      const { fetchChatSessions, chatSessions, currentSessionId, currentSession } = useChatSessions()

      currentSessionId.value = 'session-1'
      currentSession.value = { id: 'session-1', title: 'Old Title' }

      const mockSessions = [
        { id: 'session-1', title: 'Updated Title', createdAt: '2024-01-01' },
        { id: 'session-2', title: 'Chat 2', createdAt: '2024-01-02' }
      ]

      vi.mocked(global.$fetch).mockResolvedValue({
        success: true,
        data: mockSessions,
        pagination: { limit: 20, hasMore: false }
      })

      await fetchChatSessions()

      expect(currentSession.value.title).toBe('Updated Title')
    })

    it('should handle fetch error', async () => {
      const { fetchChatSessions, sidebarError, sessionsPagination } = useChatSessions()

      vi.mocked(global.$fetch).mockRejectedValue(new Error('Network error'))

      await fetchChatSessions()

      expect(sidebarError.value).toMatchObject({
        type: 'error',
        message: 'Gagal memuat daftar chat',
        canRetry: true
      })
      expect(sessionsPagination.value.loading).toBe(false)
    })
  })

  describe('loadMoreSessions', () => {
    it('should load more sessions', async () => {
      const { loadMoreSessions, chatSessions, sessionsPagination } = useChatSessions()

      // Set initial state
      chatSessions.value = [
        { id: 'session-1', title: 'Chat 1' }
      ]
      sessionsPagination.value = {
        limit: 20,
        cursor: 'cursor-123',
        hasMore: true,
        loading: false
      }

      const mockNewSessions = [
        { id: 'session-3', title: 'Chat 3' },
        { id: 'session-4', title: 'Chat 4' }
      ]

      vi.mocked(global.$fetch).mockResolvedValue({
        success: true,
        data: mockNewSessions,
        pagination: {
          limit: 20,
          cursor: 'cursor-456',
          hasMore: false
        }
      })

      await loadMoreSessions()

      expect(chatSessions.value).toHaveLength(3)
      expect(chatSessions.value[1].id).toBe('session-3')
      expect(sessionsPagination.value.cursor).toBe('cursor-456')
      expect(sessionsPagination.value.hasMore).toBe(false)
    })

    it('should not load when hasMore is false', async () => {
      const { loadMoreSessions, sessionsPagination } = useChatSessions()

      sessionsPagination.value.hasMore = false

      await loadMoreSessions()

      expect(global.$fetch).not.toHaveBeenCalled()
    })

    it('should not load when already loading', async () => {
      const { loadMoreSessions, sessionsPagination } = useChatSessions()

      sessionsPagination.value.hasMore = true
      sessionsPagination.value.loading = true

      await loadMoreSessions()

      expect(global.$fetch).not.toHaveBeenCalled()
    })

    it('should handle load more error', async () => {
      const { loadMoreSessions, sidebarError, sessionsPagination } = useChatSessions()

      sessionsPagination.value.hasMore = true
      sessionsPagination.value.loading = false

      vi.mocked(global.$fetch).mockRejectedValue(new Error('Network error'))

      await loadMoreSessions()

      expect(sidebarError.value).toMatchObject({
        type: 'error',
        message: 'Gagal memuat lebih banyak chat',
        canRetry: true
      })
      expect(sessionsPagination.value.loading).toBe(false)
    })
  })

  describe('createNewChat', () => {
    it('should create new chat and add to sessions', async () => {
      const { createNewChat, chatSessions } = useChatSessions()

      const mockNewSession = {
        id: 'new-session-1',
        title: 'New Chat',
        model: 'gemini-2.5-flash',
        createdAt: '2024-01-03'
      }

      vi.mocked(global.$fetch).mockResolvedValue({
        data: mockNewSession
      })

      const sessionId = await createNewChat('gemini-2.5-flash')

      expect(sessionId).toBe('new-session-1')
      expect(chatSessions.value).toHaveLength(1)
      expect(chatSessions.value[0]).toEqual(mockNewSession)
      expect(global.$fetch).toHaveBeenCalledWith('/api/chat/sessions', {
        method: 'POST',
        body: { model: 'gemini-2.5-flash' }
      })
    })

    it('should prepend new chat to existing sessions', async () => {
      const { createNewChat, chatSessions } = useChatSessions()

      chatSessions.value = [
        { id: 'session-1', title: 'Existing Chat' }
      ]

      const mockNewSession = {
        id: 'new-session-2',
        title: 'Newer Chat'
      }

      vi.mocked(global.$fetch).mockResolvedValue({
        data: mockNewSession
      })

      await createNewChat('gemini-2.5-flash')

      expect(chatSessions.value).toHaveLength(2)
      expect(chatSessions.value[0].id).toBe('new-session-2')
      expect(chatSessions.value[1].id).toBe('session-1')
    })

    it('should handle create error', async () => {
      const { createNewChat, sidebarError } = useChatSessions()

      vi.mocked(global.$fetch).mockRejectedValue(new Error('Create failed'))

      const result = await createNewChat('gemini-2.5-flash')

      expect(result).toBeUndefined()
      expect(sidebarError.value).toMatchObject({
        type: 'error',
        message: 'Gagal membuat chat baru',
        canRetry: true
      })
    })
  })

  describe('deleteSession', () => {
    it('should delete session from list', async () => {
      const { deleteSession, chatSessions } = useChatSessions()

      chatSessions.value = [
        { id: 'session-1', title: 'Chat 1' },
        { id: 'session-2', title: 'Chat 2' }
      ]

      vi.mocked(global.$fetch).mockResolvedValue({})

      const shouldClearMessages = await deleteSession('session-2')

      expect(chatSessions.value).toHaveLength(1)
      expect(chatSessions.value[0].id).toBe('session-1')
      expect(shouldClearMessages).toBe(false)
      expect(global.$fetch).toHaveBeenCalledWith('/api/chat/sessions/session-2', {
        method: 'DELETE'
      })
    })

    it('should clear current session if deleted', async () => {
      const { deleteSession, chatSessions, currentSessionId, currentSession } = useChatSessions()

      chatSessions.value = [
        { id: 'session-1', title: 'Chat 1' },
        { id: 'session-2', title: 'Chat 2' }
      ]
      currentSessionId.value = 'session-1'
      currentSession.value = { id: 'session-1', title: 'Chat 1' }

      vi.mocked(global.$fetch).mockResolvedValue({})

      const shouldClearMessages = await deleteSession('session-1')

      expect(chatSessions.value).toHaveLength(1)
      expect(currentSessionId.value).toBeNull()
      expect(currentSession.value).toBeNull()
      expect(shouldClearMessages).toBe(true)
    })

    it('should handle delete error', async () => {
      const { deleteSession, sidebarError } = useChatSessions()

      vi.mocked(global.$fetch).mockRejectedValue(new Error('Delete failed'))

      await expect(deleteSession('session-1')).rejects.toThrow('Delete failed')

      expect(sidebarError.value).toMatchObject({
        type: 'error',
        message: 'Gagal menghapus chat',
        canRetry: true
      })
    })
  })

  describe('renameSession', () => {
    it('should rename session in list', async () => {
      const { renameSession, chatSessions } = useChatSessions()

      chatSessions.value = [
        { id: 'session-1', title: 'Old Title' },
        { id: 'session-2', title: 'Chat 2' }
      ]

      vi.mocked(global.$fetch).mockResolvedValue({
        success: true
      })

      await renameSession('session-1', 'New Title')

      expect(chatSessions.value[0].title).toBe('New Title')
      expect(global.$fetch).toHaveBeenCalledWith('/api/chat/sessions/session-1/rename', {
        method: 'POST',
        body: { title: 'New Title' }
      })
    })

    it('should update current session title if renamed', async () => {
      const { renameSession, chatSessions, currentSession } = useChatSessions()

      chatSessions.value = [
        { id: 'session-1', title: 'Old Title' }
      ]
      currentSession.value = { id: 'session-1', title: 'Old Title' }

      vi.mocked(global.$fetch).mockResolvedValue({
        success: true
      })

      await renameSession('session-1', 'Updated Title')

      expect(chatSessions.value[0].title).toBe('Updated Title')
      expect(currentSession.value.title).toBe('Updated Title')
    })

    it('should handle rename error', async () => {
      const { renameSession } = useChatSessions()

      vi.mocked(global.$fetch).mockRejectedValue(new Error('Rename failed'))

      await expect(renameSession('session-1', 'New Title')).rejects.toThrow('Rename failed')
    })
  })
})
