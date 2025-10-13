<script setup>
import { PlusIcon, SendIcon, MessageSquareIcon, SparklesIcon, UserCircle2Icon, BotIcon, Loader2Icon, TrashIcon, SquareIcon, ImagePlusIcon, XIcon, FileTextIcon } from 'lucide-vue-next'
import { Chat } from '@ai-sdk/vue'
import { TextStreamChatTransport } from 'ai';

definePageMeta({
  middleware: 'auth'
})

// Authentication
const { signOut, user } = useLogtoSession()

// Chat sessions state
const currentSessionId = ref(null)
const currentSession = ref(null)
const loadingSessionId = ref(null)

// Error states
const sidebarError = ref(null)
const messagesError = ref(null)
const chatError = ref(null)

// Session list pagination
const sessionsPagination = ref({
  limit: 20,
  cursor: null,
  hasMore: false,
  loading: false
})

const chatSessions = ref([])

// Helper function to detect and format network errors
function handleNetworkError(error, context = 'operation') {
  console.error(`Error in ${context}:`, error)
  
  // Check for network-related errors
  if (!error) {
    return {
      type: 'unknown',
      message: `Terjadi kesalahan saat ${context}`,
      canRetry: true
    }
  }
  
  // Network timeout or connection refused
  if (error.name === 'TypeError' || error.message?.includes('fetch') || error.message?.includes('network')) {
    return {
      type: 'network',
      message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      canRetry: true
    }
  }
  
  // Timeout errors
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return {
      type: 'timeout',
      message: 'Koneksi timeout. Server membutuhkan waktu terlalu lama untuk merespons.',
      canRetry: true
    }
  }
  
  // Server errors (5xx)
  if (error.statusCode >= 500) {
    return {
      type: 'server',
      message: 'Server sedang mengalami masalah. Silakan coba lagi nanti.',
      canRetry: true
    }
  }
  
  // Client errors (4xx)
  if (error.statusCode >= 400 && error.statusCode < 500) {
    return {
      type: 'client',
      message: error.message || error.statusMessage || 'Permintaan tidak valid.',
      canRetry: false
    }
  }
  
  // Generic error
  return {
    type: 'unknown',
    message: error.message || error.statusMessage || `Terjadi kesalahan saat ${context}`,
    canRetry: true
  }
}

async function fetchChatSessions() {
  try {
    sessionsPagination.value.loading = true
    sidebarError.value = null
    const headers = useRequestHeaders(['cookie'])
    const response = await $fetch('/api/chat/sessions', { 
      headers,
      params: {
        limit: sessionsPagination.value.limit
      }
    })
    
    if (response?.success && response?.data) {
      chatSessions.value = response.data
      sessionsPagination.value = {
        ...sessionsPagination.value,
        cursor: response.pagination?.cursor || null,
        hasMore: response.pagination?.hasMore || false,
        loading: false
      }
    }
  } catch (error) {
    sidebarError.value = handleNetworkError(error, 'mengambil daftar chat')
    sessionsPagination.value.loading = false
  }
}

// Initial fetch
await fetchChatSessions()

console.log('[Chat] Page initialized, setting up chat composable')

// UI refs
const messagesEndRef = ref(null)
const inputRef = ref(null)

// State for tracking chat completion
const isChatStreaming = ref(false)
const finishHandlerExecuting = ref(false)

/**
 * Architecture: Reactive Streaming with Optimistic Updates
 * 
 * Flow:
 * 1. User sends message → Chat composable streams AI response chunk-by-chunk
 * 2. Vue reactivity updates UI in real-time as chunks arrive
 * 3. Backend saves to DB asynchronously during/after streaming
 * 4. Frontend TRUSTS reactive state - no refetch needed
 * 5. Only refresh session list for metadata (timestamps, auto-rename titles)
 * 
 * Benefits:
 * - No race conditions or arbitrary delays
 * - Faster UX (no unnecessary network calls)
 * - True reactive streaming experience
 * - DB as source of truth on page load/session switch
 */

// Function to handle chat completion
async function handleChatFinish() {
  // Prevent double execution
  if (finishHandlerExecuting.value) {
    return
  }
  
  finishHandlerExecuting.value = true
  
  try {
    // Trust Vue reactivity - messages are already up-to-date from streaming
    // No need to refetch from database, it's already persisted on backend
    
    // Only refresh session list for timestamp/title updates (e.g., auto-rename)
    if (currentSessionId.value) {
      // For first message, schedule refresh to catch auto-rename
      if (chat.messages.length === 2) {
        // First message - schedule refresh to catch auto-rename
        setTimeout(async () => {
          await fetchChatSessions()
          if (currentSessionId.value) {
            currentSession.value = chatSessions.value.find(s => s.id === currentSessionId.value)
          }
        }, 3000) // Wait 3 seconds for auto-rename to complete
      } else {
        // For subsequent messages, just update session timestamp
        await fetchChatSessions()
        if (currentSessionId.value) {
          currentSession.value = chatSessions.value.find(s => s.id === currentSessionId.value)
        }
      }
    }
  } catch (error) {
    // Don't set error state, non-critical failure
  } finally {
    // Reset the flag after a delay to allow for next message
    setTimeout(() => {
      finishHandlerExecuting.value = false
    }, 1000)
  }
}

// Composables
// Using Chat class with text protocol matching backend's toTextStreamResponse()
const chat = new Chat({
    transport: new TextStreamChatTransport({
      api: '/api/chat',
    }),
  body: computed(() => ({ 
    sessionId: currentSessionId.value 
  })),
  credentials: 'include',
  onFinish: async (options) => {
    // Handle different completion scenarios
    if (options.isError) {
      console.error('[Chat] Stream finished with error')
      chatError.value = 'Terjadi kesalahan saat menerima respons'
    } else if (options.isDisconnect) {
      console.error('[Chat] Stream disconnected')
      chatError.value = 'Koneksi terputus. Silakan coba lagi.'
    } else if (options.isAbort) {
      console.log('[Chat] Stream aborted by user')
    }
    
    // Always call handleChatFinish to reset state
    await handleChatFinish()
  },
  onError: (error) => {
    console.error('[Chat] onError:', error)
    chatError.value = handleNetworkError(error, 'mengirim pesan')
  }
})

// Chat composable initialized

const isChatBusy = computed(() => chat.isLoading || isChatStreaming.value)

// Watch for when chat.isLoading becomes false to detect stream completion
// This is a fallback in case onFinish doesn't fire reliably with text protocol
watch(() => chat.isLoading, async (newLoading, oldLoading) => {
  // Detect when loading just finished (was true, now false)
  if (oldLoading === true && newLoading === false && isChatStreaming.value && !finishHandlerExecuting.value) {
    isChatStreaming.value = false
    // Slight delay to ensure onFinish has a chance to fire first
    await new Promise(resolve => setTimeout(resolve, 100))
    // Only call if onFinish hasn't been triggered yet
    if (!finishHandlerExecuting.value) {
      console.log('[Chat] onFinish did not fire, executing handleChatFinish from watch')
      await handleChatFinish()
    }
  }
})

const input = ref('')
const selectedImages = ref([])
const selectedPdfs = ref([])
const fileInputRef = ref(null)
const pdfInputRef = ref(null)
const isUploadingImages = ref(false)
const isUploadingPdfs = ref(false)
const canSendMessage = computed(() => (!!input.value.trim() || selectedImages.value.length > 0 || selectedPdfs.value.length > 0) && !!currentSessionId.value && !isChatBusy.value && !isUploadingImages.value && !isUploadingPdfs.value)


// Pagination state
const messagesPagination = ref({
  total: 0,
  limit: 20,
  offset: 0,
  cursor: null,
  hasMore: false,
  loading: false
})

function mapApiMessageToUiMessage(message) {
  try {
    // Try to parse content as JSON for multimodal messages
    const parsed = JSON.parse(message.content)
    if (parsed.type === 'multimodal') {
      console.log('[Chat] Mapped multimodal message:', {
        hasImages: !!parsed.images,
        hasPdfs: !!parsed.pdfs,
        imageCount: parsed.images?.length || 0,
        pdfCount: parsed.pdfs?.length || 0
      })
      return {
        ...message,
        content: parsed,
        parts: [
          {
            type: 'text',
            text: parsed.text || ''
          }
        ]
      }
    }
  } catch (e) {
    // Not JSON, treat as plain text
  }
  
  return {
    ...message,
    parts: [
      {
        type: 'text',
        text: message.content || ''
      }
    ]
  }
}


// Auto-scroll to bottom when new messages arrive
watch(() => chat.messages, (newMessages, oldMessages) => {
  nextTick(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  })
}, { deep: true })

// Methods

async function loadMoreSessions() {
  if (!sessionsPagination.value.hasMore || sessionsPagination.value.loading) {
    return
  }

  sessionsPagination.value.loading = true

  try {
    const response = await $fetch('/api/chat/sessions', {
      params: {
        limit: sessionsPagination.value.limit,
        cursor: sessionsPagination.value.cursor
      }
    })

    if (response?.success && response?.data) {
      // Append more sessions to the list
      chatSessions.value = [...chatSessions.value, ...response.data]
      sessionsPagination.value = {
        ...sessionsPagination.value,
        cursor: response.pagination?.cursor || null,
        hasMore: response.pagination?.hasMore || false,
        loading: false
      }
    }
  } catch (error) {
    sidebarError.value = handleNetworkError(error, 'memuat lebih banyak chat')
    sessionsPagination.value.loading = false
  }
}

async function createNewChat() {
  try {
    sidebarError.value = null
    const response = await $fetch('/api/chat/sessions', {
      method: 'POST'
    })
    
    if (response.data) {
      chatSessions.value.unshift(response.data)
      await selectChatSession(response.data.id)
    }
  } catch (error) {
    sidebarError.value = handleNetworkError(error, 'membuat chat baru')
  }
}

async function selectChatSession(sessionId) {
  loadingSessionId.value = sessionId
  currentSessionId.value = sessionId
  currentSession.value = chatSessions.value.find(s => s.id === sessionId)
  
  try {
    // Reset pagination for new session
    messagesPagination.value = {
      total: 0,
      limit: 20,
      offset: 0,
      cursor: null,
      hasMore: false,
      loading: true
    }
    messagesError.value = null
    
    // Fetch messages - API returns newest first (DESC), then reverses them
    const response = await $fetch(`/api/chat/sessions/${sessionId}/messages?limit=20`)
    
    console.log('[Chat] Messages API response:', {
      success: response?.success,
      messageCount: response?.data?.length,
      messages: response?.data
    })
    
    if (response?.success && response?.data) {
      // Use splice to maintain reactivity instead of direct assignment
      const mappedMessages = response.data.map(mapApiMessageToUiMessage)
      chat.messages.splice(0, chat.messages.length, ...mappedMessages)
      console.log('[Chat] Loaded messages for session:', sessionId, 'Count:', chat.messages.length)
      console.log('[Chat] Mapped messages:', mappedMessages)
      messagesPagination.value = {
        ...messagesPagination.value,
        ...response.pagination,
        loading: false
      }
    } else {
      chat.messages.splice(0, chat.messages.length)
    }
  } catch (error) {
    messagesError.value = handleNetworkError(error, 'memuat pesan')
    chat.messages.splice(0, chat.messages.length)
    messagesPagination.value.loading = false
  } finally {
    loadingSessionId.value = null
  }
}

async function loadMoreMessages() {
  if (!currentSessionId.value || !messagesPagination.value.hasMore || messagesPagination.value.loading) {
    return
  }

  messagesPagination.value.loading = true

  try {
    const queryParams = new URLSearchParams({
      limit: messagesPagination.value.limit.toString(),
      cursor: messagesPagination.value.cursor || '',
    })

    const response = await $fetch(`/api/chat/sessions/${currentSessionId.value}/messages?${queryParams}`)

    if (response?.success && response?.data) {
      // Prepend older messages to the beginning
      const mappedMessages = response.data.map(mapApiMessageToUiMessage)
      chat.messages = [...mappedMessages, ...chat.messages]
      messagesPagination.value = {
        ...messagesPagination.value,
        ...response.pagination,
        loading: false,
      }
    }
  } catch (error) {
    messagesError.value = handleNetworkError(error, 'memuat lebih banyak pesan')
    messagesPagination.value.loading = false
  }
}

async function deleteSession(sessionId) {
  if (!confirm('Apakah Anda yakin ingin menghapus chat ini?')) {
    return
  }
  
  try {
    sidebarError.value = null
    await $fetch(`/api/chat/sessions/${sessionId}`, {
      method: 'DELETE'
    })
    
    // Remove from list
    chatSessions.value = chatSessions.value.filter(s => s.id !== sessionId)
    
    // Clear current session if it was deleted
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = null
      currentSession.value = null
      chat.messages.splice(0, chat.messages.length)
      messagesError.value = null
      messagesPagination.value = {
        total: 0,
        limit: 20,
        offset: 0,
        cursor: null,
        hasMore: false,
        loading: false
      }
    }
  } catch (error) {
    sidebarError.value = handleNetworkError(error, 'menghapus chat')
  }
}

async function handleSendMessage() {
  if ((!input.value.trim() && selectedImages.value.length === 0 && selectedPdfs.value.length === 0) || !currentSessionId.value || chat.isLoading || isChatStreaming.value) {
    return
  }

  isChatStreaming.value = true
  chatError.value = null

  try {
    // Format message following Vercel AI SDK standards
    // https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat
    const hasImages = selectedImages.value.length > 0
    const hasPdfs = selectedPdfs.value.length > 0
    const hasAttachments = hasImages || hasPdfs
    
    if (hasAttachments) {
      // Multimodal message: content as array of parts (AI SDK CoreMessage format)
      // https://sdk.vercel.ai/docs/reference/ai-sdk-core/core-message
      const contentParts = []
      
      // Add text part if present (TextPart)
      if (input.value.trim()) {
        contentParts.push({
          type: 'text',
          text: input.value
        })
      }
      
      // Add image parts (ImagePart) - AI SDK standard for images
      selectedImages.value.forEach((image) => {
        contentParts.push({
          type: 'image',
          image: image.data, // base64 string
          mimeType: image.mimeType
        })
      })
      
      // Add PDF parts as file type (will be converted to text on server)
      // Note: Gemini doesn't support PDF natively, so we extract text server-side
      selectedPdfs.value.forEach((pdf) => {
        contentParts.push({
          type: 'file',
          data: pdf.data,
          mimeType: pdf.mimeType,
          name: pdf.name,
          size: pdf.size
        })
      })
      
      await chat.sendMessage(
        { content: contentParts },
        {
          body: {
            sessionId: currentSessionId.value,
            hasImages: hasImages,
            images: selectedImages.value,
            hasPdfs: hasPdfs,
            pdfs: selectedPdfs.value
          },
        }
      )
    } else {
      // Text-only message: use standard text format
      await chat.sendMessage(
        { text: input.value },
        {
          body: {
            sessionId: currentSessionId.value,
            hasImages: false,
            hasPdfs: false
          },
        }
      )
    }
    input.value = ''
    selectedImages.value = []
    selectedPdfs.value = []
  } catch (error) {
    chatError.value = handleNetworkError(error, 'mengirim pesan')
    isChatStreaming.value = false // Only reset on error
  } finally {
    // Refocus on input after sending
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
}

function handleStop() {
  if (typeof chat.stop === 'function') {
    chat.stop()
  }
  isChatStreaming.value = false
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)

  if (diffInHours < 24) {
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    })
  } else {
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short' 
    })
  }
}

const { $renderMarkdown } = useNuxtApp()

function formatMessage(content) {
  return $renderMarkdown(content || '')
}

function getMessageText(message) {
  if (!message) {
    return ''
  }

  if (typeof message.content === 'object' && message.content?.type === 'multimodal') {
    return message.content.text || ''
  }

  if (typeof message.content === 'string') {
    return message.content
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => {
        if (typeof part === 'string') {
          return part
        }
        if (typeof part?.text === 'string') {
          return part.text
        }
        return ''
      })
      .join('')
  }

  if (Array.isArray(message.parts)) {
    return message.parts
      .map((part) => {
        if (typeof part === 'string') {
          return part
        }
        if (typeof part?.text === 'string') {
          return part.text
        }
        return ''
      })
      .join('')
  }

  if (typeof message.text === 'string') {
    return message.text
  }

  return ''
}

function getMessageImages(message) {
  if (!message) {
    return []
  }

  if (typeof message.content === 'object' && message.content?.type === 'multimodal') {
    return message.content.images || []
  }

  return []
}

function getMessagePdfs(message) {
  if (!message) {
    return []
  }

  // Check for multimodal content (from DB)
  if (typeof message.content === 'object' && message.content?.type === 'multimodal') {
    return message.content.pdfs || []
  }

  // Check for file parts in content array (real-time from AI SDK)
  if (Array.isArray(message.content)) {
    const pdfParts = message.content.filter(part => 
      part.type === 'file' && part.mimeType === 'application/pdf'
    )
    // Map to expected format
    return pdfParts.map(part => ({
      data: part.data,
      mimeType: part.mimeType,
      name: part.name || 'document.pdf',
      size: part.size || 0
    }))
  }

  return []
}

function autoResize(event) {
  const textarea = event.target
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
}

function onInput(event) {
  autoResize(event)
}

async function handleImageSelect(event) {
  const files = event.target.files
  if (!files || files.length === 0) return

  isUploadingImages.value = true
  const fileArray = Array.from(files)
  const validFiles = []

  // Validate all files first
  for (const file of fileArray) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diperbolehkan')
      continue
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB')
      continue
    }

    validFiles.push(file)
  }

  // Process all valid files
  const uploadPromises = validFiles.map((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target.result
        selectedImages.value.push({
          data: base64.split(',')[1], // Remove data:image/...;base64, prefix
          mimeType: file.type,
          preview: base64
        })
        resolve()
      }
      reader.onerror = () => reject(new Error('Gagal membaca file'))
      reader.readAsDataURL(file)
    })
  })

  try {
    await Promise.all(uploadPromises)
  } catch (error) {
    console.error('Error uploading images:', error)
    alert('Terjadi kesalahan saat mengunggah gambar')
  } finally {
    isUploadingImages.value = false
    // Reset input
    event.target.value = ''
  }
}

function removeImage(index) {
  selectedImages.value.splice(index, 1)
}

function openFileInput() {
  fileInputRef.value?.click()
}

function openPdfInput() {
  pdfInputRef.value?.click()
}

async function handlePdfSelect(event) {
  const files = event.target.files
  if (!files || files.length === 0) return

  isUploadingPdfs.value = true
  const fileArray = Array.from(files)
  const validFiles = []

  // Validate all files first
  for (const file of fileArray) {
    // Validate file type
    if (file.type !== 'application/pdf') {
      alert('Hanya file PDF yang diperbolehkan')
      continue
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file PDF maksimal 10MB')
      continue
    }

    validFiles.push(file)
  }

  // Process all valid files
  const uploadPromises = validFiles.map((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target.result
        selectedPdfs.value.push({
          data: base64.split(',')[1], // Remove data:application/pdf;base64, prefix
          mimeType: 'application/pdf',
          name: file.name,
          size: file.size
        })
        resolve()
      }
      reader.onerror = () => reject(new Error('Gagal membaca file'))
      reader.readAsDataURL(file)
    })
  })

  try {
    await Promise.all(uploadPromises)
  } catch (error) {
    console.error('Error uploading PDFs:', error)
    alert('Terjadi kesalahan saat mengunggah PDF')
  } finally {
    isUploadingPdfs.value = false
    // Reset input
    event.target.value = ''
  }
}

function removePdf(index) {
  selectedPdfs.value.splice(index, 1)
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

</script>

<template>
  <div class="h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
    <!-- Sidebar -->
    <div class="w-80 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col shadow-xl">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200/50">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <SparklesIcon class="w-6 h-6 text-indigo-600" />
            <h1 class="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Gemini Chat</h1>
          </div>
          <button
            @click="signOut"
            class="text-gray-500 hover:text-red-600 text-sm font-medium transition-colors"
          >
            Keluar
          </button>
        </div>
        <button
          @click="createNewChat"
          class="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02]"
        >
          <PlusIcon class="w-5 h-5" />
          Chat Baru
        </button>
      </div>

      <!-- Sidebar Error Alert -->
      <div v-if="sidebarError" class="mx-3 mt-3 bg-red-50 border border-red-200 rounded-lg p-3 animate-fade-in">
        <div class="flex items-start gap-2">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-red-800">{{ sidebarError.message }}</p>
            <button
              v-if="sidebarError.canRetry"
              @click="fetchChatSessions"
              class="mt-2 text-xs font-medium text-red-700 hover:text-red-800 underline"
            >
              Coba Lagi
            </button>
          </div>
          <button
            @click="sidebarError = null"
            class="flex-shrink-0 text-red-400 hover:text-red-600"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Chat Sessions List -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        <div
          v-for="session in chatSessions"
          :key="session.id"
          :class="[
            'group relative p-3 rounded-xl cursor-pointer transition-all duration-200',
            currentSessionId === session.id
              ? 'bg-gradient-to-r from-indigo-100 to-blue-100 border border-indigo-200 shadow-md'
              : 'hover:bg-gray-100/70 hover:shadow-sm'
          ]"
        >
          <div @click="selectChatSession(session.id)" class="flex-1">
            <div class="flex items-start gap-2">
              <Loader2Icon v-if="loadingSessionId === session.id" class="w-4 h-4 mt-1 flex-shrink-0 text-indigo-600 animate-spin" />
              <MessageSquareIcon v-else class="w-4 h-4 mt-1 flex-shrink-0" :class="currentSessionId === session.id ? 'text-indigo-600' : 'text-gray-400'" />
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900 truncate text-sm">{{ session.title }}</h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ formatDate(session.updatedAt) }}
                </p>
              </div>
            </div>
          </div>
          <button
            @click.stop="deleteSession(session.id)"
            class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 rounded-lg"
            title="Hapus chat"
          >
            <TrashIcon class="w-3.5 h-3.5 text-red-600" />
          </button>
        </div>
        
        <div v-if="chatSessions.length === 0 && !sessionsPagination.loading" class="text-center text-gray-500 py-12">
          <MessageSquareIcon class="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p class="text-sm">Belum ada riwayat chat</p>
        </div>
        
        <!-- Load More Sessions Button -->
        <div v-if="sessionsPagination.hasMore" class="px-3 pb-3">
          <button
            @click="loadMoreSessions"
            :disabled="sessionsPagination.loading"
            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2Icon v-if="sessionsPagination.loading" class="w-4 h-4 animate-spin" />
            <span v-else>Muat Lebih Banyak</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col">
      <!-- Chat Header -->
      <div class="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 p-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
            <BotIcon class="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">
              {{ currentSession?.title || 'Pilih atau buat chat baru' }}
            </h2>
            <p class="text-xs text-gray-500">Powered by Google Gemini 2.5 Pro</p>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <!-- Loading State -->
        <div v-if="messagesPagination.loading && chat.messages.length === 0" class="flex flex-col items-center justify-center py-20">
          <Loader2Icon class="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p class="text-gray-500 font-medium">Memuat pesan...</p>
        </div>
        <template v-else>
        <!-- Messages Error Alert -->
        <div v-if="messagesError" class="bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
          <div class="flex items-start gap-3">
            <svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <div class="flex-1">
              <p class="font-semibold text-red-800">Kesalahan Jaringan</p>
              <p class="text-sm text-red-700 mt-1">{{ messagesError.message }}</p>
              <button
                v-if="messagesError.canRetry && currentSessionId"
                @click="selectChatSession(currentSessionId)"
                class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Coba Lagi
              </button>
            </div>
            <button
              @click="messagesError = null"
              class="flex-shrink-0 text-red-400 hover:text-red-600"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Chat Error Alert -->
        <div v-if="chatError" class="bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
          <div class="flex items-start gap-3">
            <svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <div class="flex-1">
              <p class="font-semibold text-red-800">Gagal Mengirim Pesan</p>
              <p class="text-sm text-red-700 mt-1">{{ chatError.message }}</p>
              <p v-if="chatError.canRetry" class="text-xs text-red-600 mt-2">Pesan Anda tidak terkirim. Silakan coba kirim ulang.</p>
            </div>
            <button
              @click="chatError = null"
              class="flex-shrink-0 text-red-400 hover:text-red-600"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- AI SDK Error Alert -->
        <div v-if="chat.error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md relative animate-fade-in">
          <div class="flex">
            <div class="py-1"><svg class="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2h-2a1 1 0 0 1-1-1zm-1-4a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1z"/></svg></div>
            <div>
              <p class="font-bold">Terjadi Kesalahan</p>
              <p class="text-sm">{{ chat.error.message }}</p>
            </div>
          </div>
          <button @click="chat.error = null" class="absolute top-2 right-2 text-red-500 hover:text-red-700">
            <svg class="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </button>
        </div>

        <!-- Load More Button -->
        <div v-if="messagesPagination.hasMore" class="flex justify-center">
          <button
            @click="loadMoreMessages"
            :disabled="messagesPagination.loading"
            class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2Icon v-if="messagesPagination.loading" class="w-4 h-4 animate-spin" />
            <span v-else>Muat Lebih Lama</span>
          </button>
        </div>
        
        <div
          v-for="(message, index) in chat.messages"
          :key="message.id || index"
          :class="[
            'flex gap-3 animate-fade-in',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          ]"
        >
          <!-- Avatar -->
          <div v-if="message.role === 'assistant'" class="flex-shrink-0">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
              <BotIcon class="w-4 h-4 text-white" />
            </div>
          </div>
          
          <!-- Message Content -->
          <div
            :class="[
              'max-w-2xl px-5 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md',
              message.role === 'user'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-tr-sm'
                : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
            ]"
          >
            <!-- Images -->
            <div v-if="getMessageImages(message).length > 0" class="mb-3 flex flex-wrap gap-2">
              <img
                v-for="(image, idx) in getMessageImages(message)"
                :key="idx"
                :src="`data:${image.mimeType || 'image/jpeg'};base64,${image.data}`"
                class="max-w-xs max-h-48 rounded-lg object-cover"
                :class="message.role === 'user' ? 'border-2 border-white/30' : 'border border-gray-200'"
              />
            </div>
            
            <!-- PDFs -->
            <div v-if="getMessagePdfs(message).length > 0" class="mb-3 flex flex-wrap gap-2">
              <div
                v-for="(pdf, idx) in getMessagePdfs(message)"
                :key="'msg-pdf-' + idx"
                :class="[
                  'px-3 py-2 rounded-lg flex items-center gap-2',
                  message.role === 'user' 
                    ? 'bg-white/20 border border-white/30' 
                    : 'bg-blue-50 border border-blue-200'
                ]"
              >
                <FileTextIcon 
                  class="w-4 h-4 flex-shrink-0" 
                  :class="message.role === 'user' ? 'text-white' : 'text-blue-600'"
                />
                <span 
                  class="text-sm font-medium truncate max-w-xs"
                  :class="message.role === 'user' ? 'text-white' : 'text-blue-800'"
                >{{ pdf.name }}</span>
              </div>
            </div>
            
            <!-- Text Content -->
            <div 
              v-if="getMessageText(message)"
              class="prose prose-sm max-w-none leading-snug" 
              :class="message.role === 'user' ? 'prose-invert' : ''"
              v-html="formatMessage(getMessageText(message))"
            ></div>
          </div>
          
          <!-- User Avatar -->
          <div v-if="message.role === 'user'" class="flex-shrink-0">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
              <UserCircle2Icon class="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        
        
        <div v-if="chat.messages.length === 0 && currentSessionId" class="flex flex-col items-center justify-center py-20 text-center">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center mb-4">
            <SparklesIcon class="w-10 h-10 text-indigo-600" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Mulai Percakapan</h3>
          <p class="text-gray-500 max-w-md">Tanyakan apa saja kepada Gemini AI. Saya siap membantu Anda!</p>
        </div>
        
        <div ref="messagesEndRef"></div>
        </template>
      </div>

      <!-- Input Area -->
      <div class="bg-white/80 backdrop-blur-xl border-t border-gray-200/50 p-4 shadow-lg">
        <div class="max-w-4xl mx-auto">
          <!-- Image Previews -->
          <div v-if="selectedImages.length > 0 || isUploadingImages || selectedPdfs.length > 0 || isUploadingPdfs" class="mb-3 flex flex-wrap gap-2">
            <div
              v-for="(image, index) in selectedImages"
              :key="index"
              class="relative group"
            >
              <img
                :src="image.preview"
                class="w-20 h-20 object-cover rounded-lg border-2 border-indigo-200"
              />
              <button
                @click="removeImage(index)"
                class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XIcon class="w-3 h-3" />
              </button>
            </div>
            
            <!-- Upload loading indicator -->
            <div v-if="isUploadingImages" class="w-20 h-20 rounded-lg border-2 border-indigo-200 bg-indigo-50 flex items-center justify-center">
              <Loader2Icon class="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
            
            <!-- PDF Previews -->
            <div
              v-for="(pdf, index) in selectedPdfs"
              :key="'pdf-' + index"
              class="relative group"
            >
              <div class="w-32 h-20 rounded-lg border-2 border-blue-200 bg-blue-50 p-2 flex flex-col items-center justify-center">
                <FileTextIcon class="w-6 h-6 text-blue-600 mb-1" />
                <p class="text-xs text-blue-800 font-medium truncate w-full text-center px-1">{{ pdf.name }}</p>
                <p class="text-xs text-blue-600">{{ formatFileSize(pdf.size) }}</p>
              </div>
              <button
                @click="removePdf(index)"
                class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XIcon class="w-3 h-3" />
              </button>
            </div>
            
            <!-- PDF Upload loading indicator -->
            <div v-if="isUploadingPdfs" class="w-32 h-20 rounded-lg border-2 border-blue-200 bg-blue-50 flex items-center justify-center">
              <Loader2Icon class="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          </div>
          
          <div class="flex gap-3 items-end">
            <!-- Hidden file inputs -->
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              multiple
              @change="handleImageSelect"
              class="hidden"
            />
            <input
              ref="pdfInputRef"
              type="file"
              accept="application/pdf,.pdf"
              multiple
              @change="handlePdfSelect"
              class="hidden"
            />
            
            <!-- Image upload button -->
            <button
              type="button"
              @click="openFileInput"
              :disabled="isChatBusy || !currentSessionId || isUploadingImages || isUploadingPdfs"
              class="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              :title="isUploadingImages ? 'Mengunggah gambar...' : 'Upload gambar'"
            >
              <Loader2Icon v-if="isUploadingImages" class="w-5 h-5 animate-spin" />
              <ImagePlusIcon v-else class="w-5 h-5" />
            </button>
            
            <!-- PDF upload button -->
            <button
              type="button"
              @click="openPdfInput"
              :disabled="isChatBusy || !currentSessionId || isUploadingImages || isUploadingPdfs"
              class="flex-shrink-0 bg-blue-100 hover:bg-blue-200 text-blue-700 p-3 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              :title="isUploadingPdfs ? 'Mengunggah PDF...' : 'Upload PDF'"
            >
              <Loader2Icon v-if="isUploadingPdfs" class="w-5 h-5 animate-spin" />
              <FileTextIcon v-else class="w-5 h-5" />
            </button>
            
            <div class="flex-1 relative">
              <form @submit.prevent="handleSendMessage">
                <textarea
                  ref="inputRef"
                  v-model="input"
                  @input="onInput"
                  @keydown.enter.exact.prevent="handleSendMessage"
                  :disabled="isChatBusy || !currentSessionId || isUploadingImages || isUploadingPdfs"
                  :placeholder="isUploadingImages ? 'Mengunggah gambar...' : isUploadingPdfs ? 'Mengunggah PDF...' : 'Ketik pesan Anda... (Enter untuk kirim)'"
                  rows="1"
                  :class="[
                    'w-full px-5 py-3 pr-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 resize-none transition-all duration-200 shadow-sm hover:shadow-md',
                    {
                      'text-gray-400 placeholder:text-gray-400': isChatBusy || !currentSessionId
                    }
                  ]"
                  style="max-height: 150px; min-height: 48px;"
                />
              </form>
            </div>
            <button
              type="button"
              @click="isChatBusy ? handleStop() : handleSendMessage()"
              :disabled="isChatBusy ? false : !canSendMessage"
              :class="[
                'text-white font-medium px-5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed min-w-[48px] h-12',
                isChatBusy
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700'
                  : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400'
              ]"
            >
              <SquareIcon v-if="isChatBusy" class="w-5 h-5" />
              <SendIcon v-else class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
