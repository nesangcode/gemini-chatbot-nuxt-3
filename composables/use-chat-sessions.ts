export function useChatSessions() {
  const chatSessions = ref<any[]>([])
  const currentSessionId = ref<string | null>(null)
  const currentSession = ref<any>(null)
  const loadingSessionId = ref<string | null>(null)
  const sidebarError = ref<any>(null)
  
  const sessionsPagination = ref<any>({
    limit: 20,
    cursor: null,
    hasMore: false,
    loading: false
  })

  async function fetchChatSessions(refresh = false) {
    try {
      sidebarError.value = null
      sessionsPagination.value.loading = true
      
      // If refresh, reset cursor to fetch from the beginning
      const cursor = refresh ? undefined : (sessionsPagination.value.cursor || undefined)
      
      const response = await $fetch('/api/chat/sessions', {
        params: {
          limit: sessionsPagination.value.limit,
          cursor
        }
      })
      
      if (response?.success && response?.data) {
        chatSessions.value = response.data
        
        // Update currentSession if it exists and we're refreshing
        if (currentSessionId.value) {
          const updatedSession = response.data.find((s: any) => s.id === currentSessionId.value)
          if (updatedSession) {
            currentSession.value = updatedSession
          }
        }
        
        if (response.pagination) {
          sessionsPagination.value = {
            ...sessionsPagination.value,
            ...response.pagination,
            loading: false
          }
          
          // Reset cursor if this was a refresh
          if (refresh) {
            sessionsPagination.value.cursor = response.pagination.cursor
          }
        }
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
      sidebarError.value = {
        type: 'error',
        message: 'Gagal memuat daftar chat',
        canRetry: true
      }
      sessionsPagination.value.loading = false
    }
  }

  async function loadMoreSessions() {
    if (!sessionsPagination.value.hasMore || sessionsPagination.value.loading) {
      return
    }
    
    try {
      sessionsPagination.value.loading = true
      sidebarError.value = null
      
      const response = await $fetch('/api/chat/sessions', {
        params: {
          limit: sessionsPagination.value.limit,
          cursor: sessionsPagination.value.cursor || undefined
        }
      })
      
      if (response?.success && response?.data) {
        chatSessions.value = [...chatSessions.value, ...response.data]
        
        if (response.pagination) {
          sessionsPagination.value = {
            ...sessionsPagination.value,
            ...response.pagination,
            loading: false
          }
        }
      }
    } catch (error) {
      console.error('Error loading more sessions:', error)
      sidebarError.value = {
        type: 'error',
        message: 'Gagal memuat lebih banyak chat',
        canRetry: true
      }
      sessionsPagination.value.loading = false
    }
  }

  async function createNewChat(model: string) {
    try {
      sidebarError.value = null
      const response = await $fetch('/api/chat/sessions', {
        method: 'POST',
        body: { model }
      })
      
      if (response.data) {
        chatSessions.value.unshift(response.data)
        return response.data.id
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      sidebarError.value = {
        type: 'error',
        message: 'Gagal membuat chat baru',
        canRetry: true
      }
    }
  }

  async function deleteSession(sessionId: string) {
    try {
      sidebarError.value = null
      await $fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      
      chatSessions.value = chatSessions.value.filter(s => s.id !== sessionId)
      
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = null
        currentSession.value = null
        return true // Signal to clear messages
      }
      return false
    } catch (error) {
      console.error('Error deleting session:', error)
      sidebarError.value = {
        type: 'error',
        message: 'Gagal menghapus chat',
        canRetry: true
      }
      throw error
    }
  }

  async function renameSession(sessionId: string, newTitle: string) {
    try {
      const response = await $fetch(`/api/chat/sessions/${sessionId}/rename`, {
        method: 'POST',
        body: { title: newTitle }
      })
      
      if (response.success) {
        const session = chatSessions.value.find(s => s.id === sessionId)
        if (session) {
          session.title = newTitle
        }
        if (currentSession.value?.id === sessionId) {
          currentSession.value.title = newTitle
        }
      }
    } catch (error) {
      console.error('Error renaming session:', error)
      throw error
    }
  }

  return {
    chatSessions,
    currentSessionId,
    currentSession,
    loadingSessionId,
    sidebarError,
    sessionsPagination,
    fetchChatSessions,
    loadMoreSessions,
    createNewChat,
    deleteSession,
    renameSession
  }
}
