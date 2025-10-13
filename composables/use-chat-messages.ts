export function useChatMessages() {
  const messagesError = ref<any>(null)
  const isLoadingOlderMessages = ref(false)
  
  const messagesPagination = ref<any>({
    total: 0,
    limit: 10,
    offset: 0,
    cursor: null,
    hasMore: false,
    loading: false
  })

  function mapApiMessageToUiMessage(message: any) {
    // Backend already parses JSON, so content can be string or object
    const content = message.content
    
    console.log('[MAP] Message:', { id: message.id, role: message.role, type: typeof content })
    
    // If it's multimodal format from API (with text and images/pdfs fields)
    if (content && typeof content === 'object' && content.type === 'multimodal') {
      const parts = []
      
      // Add text part
      if (content.text) {
        parts.push({ type: 'text', text: content.text })
      }
      
      // Add image parts
      if (content.images && Array.isArray(content.images)) {
        content.images.forEach((img: any) => {
          const imageData = img.data ? `data:${img.mimeType || 'image/png'};base64,${img.data}` : img.url
          parts.push({
            type: 'image',
            image: imageData,
            mimeType: img.mimeType
          })
        })
      }
      
      // Add PDF parts
      if (content.pdfs && Array.isArray(content.pdfs)) {
        content.pdfs.forEach((pdf: any) => {
          parts.push({
            type: 'file',
            name: pdf.name,
            mimeType: pdf.mimeType
          })
        })
      }
      
      console.log('[MAP] Multimodal -> parts:', parts.length, 'parts')
      return {
        id: message.id,
        role: message.role,
        content: parts
      }
    }
    
    // Plain text message
    console.log('[MAP] Plain text message')
    return {
      id: message.id,
      role: message.role,
      content: content || ''
    }
  }

  async function fetchMessages(sessionId: string) {
    messagesPagination.value = {
      total: 0,
      limit: 10,
      offset: 0,
      cursor: null,
      hasMore: false,
      loading: true
    }
    messagesError.value = null
    
    try {
      const response = await $fetch(`/api/chat/sessions/${sessionId}/messages?limit=10`)
      
      if (response?.success && response?.data) {
        const mappedMessages = response.data.map(mapApiMessageToUiMessage)
        
        if (response.pagination) {
          messagesPagination.value = {
            ...messagesPagination.value,
            ...response.pagination,
            loading: false
          }
        }
        
        return mappedMessages
      }
      
      messagesPagination.value.loading = false
      return []
    } catch (error) {
      console.error('Error fetching messages:', error)
      messagesError.value = {
        type: 'error',
        message: 'Gagal memuat pesan',
        canRetry: true
      }
      messagesPagination.value.loading = false
      return []
    }
  }

  async function loadMoreMessages(sessionId: string) {
    if (!sessionId || !messagesPagination.value.hasMore || messagesPagination.value.loading) {
      return { messages: [], scrollData: null }
    }

    messagesPagination.value.loading = true
    isLoadingOlderMessages.value = true

    try {
      const queryParams = new URLSearchParams({
        limit: messagesPagination.value.limit.toString(),
        cursor: messagesPagination.value.cursor || '',
      })

      const response = await $fetch(`/api/chat/sessions/${sessionId}/messages?${queryParams}`)

      if (response?.success && response?.data) {
        const mappedMessages = response.data.map(mapApiMessageToUiMessage)
        
        messagesPagination.value = {
          ...messagesPagination.value,
          ...response.pagination,
          loading: false,
        }
        
        return { messages: mappedMessages, scrollData: null }
      }
      
      messagesPagination.value.loading = false
      isLoadingOlderMessages.value = false
      return { messages: [], scrollData: null }
    } catch (error) {
      console.error('Error loading more messages:', error)
      messagesError.value = {
        type: 'error',
        message: 'Gagal memuat lebih banyak pesan',
        canRetry: true
      }
      messagesPagination.value.loading = false
      isLoadingOlderMessages.value = false
      return { messages: [], scrollData: null }
    }
  }
  
  function finishLoadingOlderMessages() {
    setTimeout(() => {
      isLoadingOlderMessages.value = false
    }, 150)
  }

  function clearMessages() {
    messagesPagination.value = {
      total: 0,
      limit: 10,
      offset: 0,
      cursor: null,
      hasMore: false,
      loading: false
    }
    messagesError.value = null
  }

  return {
    messagesError,
    messagesPagination,
    isLoadingOlderMessages,
    fetchMessages,
    loadMoreMessages,
    finishLoadingOlderMessages,
    clearMessages
  }
}
