<script setup>
import { SparklesIcon, BotIcon, Loader2Icon, MenuIcon } from 'lucide-vue-next'
import { Chat } from '@ai-sdk/vue'
import { TextStreamChatTransport } from 'ai'
import ModelSelector from '~/components/ModelSelector.vue'
import ChatSidebar from '~/components/chat/ChatSidebar.vue'
import ChatMessage from '~/components/chat/ChatMessage.vue'
import ChatInput from '~/components/chat/ChatInput.vue'

definePageMeta({
  middleware: 'auth'
})

// Auth
const { signOut } = useLogtoSession()

// Fetch user data from database (includes email)
const { data: authData } = await useFetch('/api/auth/me')
const user = computed(() => authData.value?.user)

// Composables
const {
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
} = useChatSessions()

const {
  messagesError,
  messagesPagination,
  isLoadingOlderMessages,
  fetchMessages,
  loadMoreMessages,
  finishLoadingOlderMessages,
  clearMessages
} = useChatMessages()

const {
  selectedImages,
  selectedPdfs,
  fileInputRef,
  pdfInputRef,
  isUploadingImages,
  isUploadingPdfs,
  triggerImageUpload,
  triggerPdfUpload,
  handleImageSelect,
  handlePdfSelect,
  removeImage,
  removePdf,
  clearAllFiles
} = useFileUpload()

// UI refs
const messagesEndRef = ref(null)
const messagesContainerRef = ref(null)
const chatInputRef = ref(null)
const isSidebarOpen = ref(false)

// Model selection
const selectedModel = ref('gemini-2.5-flash')

// Chat state
const input = ref('')
const chatError = ref(null)

// Helper function for network errors
function handleNetworkError(error, context = 'operation') {
  console.error(`Error in ${context}:`, error)
  
  if (!error) {
    return { type: 'unknown', message: `Terjadi kesalahan saat ${context}`, canRetry: true }
  }
  
  if (error.name === 'TypeError' || error.message?.includes('fetch') || error.message?.includes('network')) {
    return { type: 'network', message: `Koneksi terputus saat ${context}. Periksa internet Anda.`, canRetry: true }
  }
  
  if (error.statusCode === 503 || error.statusMessage?.includes('timeout')) {
    return { type: 'timeout', message: `Server tidak merespons saat ${context}. Coba lagi.`, canRetry: true }
  }
  
  return { type: 'error', message: error.message || `Gagal ${context}`, canRetry: true }
}

// Chat finish handler
function handleChatFinish() {
  // Reload sessions from the beginning to get updated timestamps and titles
  fetchChatSessions(true).catch(err => console.error('Failed to refresh sessions:', err))
}

// AI SDK Chat
const chat = new Chat({
  transport: new TextStreamChatTransport({
    api: '/api/chat',
    body: () => ({ 
      sessionId: currentSessionId.value 
    }),
    credentials: 'include',
  }),
  onFinish: (options) => {
    if (options.isError) {
      console.error('[Chat] Stream finished with error')
      chatError.value = { message: 'Terjadi kesalahan saat menerima respons' }
      return
    }
    
    if (options.isDisconnect) {
      console.error('[Chat] Stream disconnected')
      chatError.value = { message: 'Koneksi terputus. Silakan coba lagi.' }
      return
    }
    
    if (options.isAbort) {
      console.log('[Chat] Stream aborted by user')
      return
    }
    
    // Only refresh sessions on successful completion
    handleChatFinish()
  },
  onError: (error) => {
    console.error('[Chat] onError:', error)
    chatError.value = handleNetworkError(error, 'mengirim pesan')
  }
})

const isChatBusy = computed(() => chat.status === 'streaming' || chat.status === 'submitted')
const canSendMessage = computed(() => 
  (!!input.value.trim() || selectedImages.value.length > 0 || selectedPdfs.value.length > 0) && 
  !!currentSessionId.value && 
  !isChatBusy.value && 
  !isUploadingImages.value && 
  !isUploadingPdfs.value
)

// Dynamic greeting based on time of day
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour >= 0 && hour < 11) return 'Selamat pagi'
  if (hour >= 11 && hour < 15) return 'Selamat siang'
  if (hour >= 15 && hour < 19) return 'Selamat sore'
  return 'Selamat malam'
})

// Auto-scroll (but not when loading older messages)
watch(() => chat.messages, () => {
  if (isLoadingOlderMessages.value) return
  nextTick(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  })
}, { deep: true })

// Initialize on client-side only
onMounted(() => {
  fetchChatSessions()
})

// Session management
async function handleCreateChat() {
  const newSessionId = await createNewChat(selectedModel.value)
  if (newSessionId) {
    await handleSelectSession(newSessionId)
  }
}

async function handleSelectSession(sessionId) {
  loadingSessionId.value = sessionId
  currentSessionId.value = sessionId
  currentSession.value = chatSessions.value.find(s => s.id === sessionId)
  
  if (currentSession.value?.model) {
    selectedModel.value = currentSession.value.model
  }
  
  try {
    const messages = await fetchMessages(sessionId)
    chat.messages.splice(0, chat.messages.length, ...messages)
  } finally {
    loadingSessionId.value = null
  }
  
  // Close sidebar on mobile after selection
  isSidebarOpen.value = false
}

async function handleDeleteSession(sessionId) {
  if (!confirm('Apakah Anda yakin ingin menghapus chat ini?')) return
  
  const shouldClearMessages = await deleteSession(sessionId)
  if (shouldClearMessages) {
    chat.messages.splice(0, chat.messages.length)
    clearMessages()
  }
}

async function handleLoadMoreMessages() {
  const container = messagesContainerRef.value
  if (!container) return
  
  // Save scroll position BEFORE loading
  const scrollHeightBefore = container.scrollHeight
  const scrollTopBefore = container.scrollTop
  
  const result = await loadMoreMessages(currentSessionId.value)
  if (result.messages.length > 0) {
    // Add messages to array
    chat.messages = [...result.messages, ...chat.messages]
    
    // Wait for DOM to update, then restore scroll
    await nextTick()
    await nextTick() // Double nextTick to ensure rendering is complete
    
    const scrollHeightAfter = container.scrollHeight
    const addedHeight = scrollHeightAfter - scrollHeightBefore
    container.scrollTop = scrollTopBefore + addedHeight
    
    // Re-enable auto-scroll after a delay
    finishLoadingOlderMessages()
  }
}

// Model change
async function handleModelChange(newModel) {
  if (!currentSessionId.value) {
    selectedModel.value = newModel
    return
  }
  
  try {
    const response = await $fetch(`/api/chat/sessions/${currentSessionId.value}/model`, {
      method: 'PATCH',
      body: { model: newModel }
    })
    
    if (response.success) {
      selectedModel.value = newModel
      if (currentSession.value) currentSession.value.model = newModel
      const sessionInList = chatSessions.value.find(s => s.id === currentSessionId.value)
      if (sessionInList) sessionInList.model = newModel
    }
  } catch (error) {
    console.error('Error updating model:', error)
    chatError.value = { message: 'Gagal mengubah model' }
  }
}

// Send message
async function handleSendMessage() {
  // Auto-create session if none exists
  if (!currentSessionId.value) {
    const newSessionId = await createNewChat(selectedModel.value)
    if (!newSessionId) {
      chatError.value = { message: 'Gagal membuat chat baru' }
      return
    }
    await handleSelectSession(newSessionId)
  }
  
  if (!canSendMessage.value) return
  
  const hasImages = selectedImages.value.length > 0
  const hasPdfs = selectedPdfs.value.length > 0
  const hasAttachments = hasImages || hasPdfs

  try {
    chatError.value = null

    if (hasAttachments) {
      // Multimodal message: content as array of parts
      const contentParts = []
      
      // Always add text part first (required by Gemini, even if empty)
      contentParts.push({
        type: 'text',
        text: input.value.trim() || 'Silakan analisis gambar/file ini.'
      })
      
      // Add image parts
      selectedImages.value.forEach(image => {
        // Use the preview (data URL) for immediate display in UI
        // The base64 data is sent separately in the body for API processing
        contentParts.push({
          type: 'image',
          image: image.preview, // Full data URL for immediate display
          mimeType: image.mimeType
        })
      })
      
      // Add PDF parts as file type
      selectedPdfs.value.forEach((pdf, index) => {
        console.log(`[Send] Adding PDF ${index + 1}:`, {
          name: pdf.name,
          mimeType: pdf.mimeType,
          dataLength: pdf.data?.length || 0,
          size: pdf.size
        })
        contentParts.push({
          type: 'file',
          data: pdf.data,
          mediaType: pdf.mimeType,
        })
      })
      
      await chat.sendMessage(
        { content: contentParts },
        {
          body: {
            sessionId: currentSessionId.value,
            hasImages,
            images: selectedImages.value,
            hasPdfs,
            pdfs: selectedPdfs.value
          },
        }
      )
    } else {
      // Text-only message: use content array format for consistency
      const messageContent = [{ type: 'text', text: input.value.trim() }]
      console.log('[Send] Text-only message:', messageContent)
      
      await chat.sendMessage(
        { content: messageContent },
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
    clearAllFiles()
    nextTick(() => chatInputRef.value?.inputRef?.focus())

  } catch (error) {
    console.error('Send message error:', error)
    chatError.value = handleNetworkError(error, 'mengirim pesan')
  }
}
</script>

<template>
  <div class="h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
    <!-- Mobile Overlay -->
    <div 
      v-if="isSidebarOpen"
      @click="isSidebarOpen = false"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
    />
    
    <!-- Sidebar -->
    <ChatSidebar
      :sessions="chatSessions"
      :current-session-id="currentSessionId"
      :loading-session-id="loadingSessionId"
      :error="sidebarError"
      :pagination="sessionsPagination"
      :user="user"
      :is-open="isSidebarOpen"
      @create-chat="handleCreateChat"
      @select-session="handleSelectSession"
      @delete-session="handleDeleteSession"
      @load-more="loadMoreSessions"
      @clear-error="sidebarError = null"
      @close="isSidebarOpen = false"
    />

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col">
      <!-- Chat Header -->
      <div class="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 p-3 md:p-4 shadow-sm">
        <div class="flex items-center justify-between gap-2 md:gap-3">
          <div class="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <!-- Mobile Menu Button -->
            <button
              @click="isSidebarOpen = true"
              class="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MenuIcon class="w-5 h-5" />
            </button>
            
            <div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <BotIcon class="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-sm md:text-lg font-semibold text-gray-900 truncate">
                {{ currentSession?.title || 'Pilih atau buat chat baru' }}
              </h2>
              <p class="text-xs text-gray-500 hidden sm:block">Powered by Google Gemini AI</p>
            </div>
          </div>
          <div class="flex-shrink-0">
            <ModelSelector
              v-model="selectedModel"
              :disabled="isChatBusy"
              @update:model-value="handleModelChange"
            />
          </div>
        </div>
      </div>

      <!-- Welcome Screen (No Session Selected) -->
      <div v-if="!currentSessionId" class="flex-1 flex flex-col items-center justify-center p-6">
        <div class="w-full max-w-3xl flex flex-col items-center text-center space-y-8">
          <!-- Welcome Message -->
          <div class="space-y-4">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-2xl mx-auto">
              <BotIcon class="w-12 h-12 text-white" />
            </div>
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900">
              {{ greeting }}, <span class="text-indigo-600">{{ user?.email || 'Pengguna' }}</span>
            </h1>
            <p class="text-lg text-gray-600 max-w-2xl">
              Mulai percakapan baru dengan Gemini AI atau pilih chat dari sidebar
            </p>
          </div>

          <!-- Centered Input Area -->
          <div class="w-full">
            <ChatInput
              ref="chatInputRef"
              v-model="input"
              :can-send="!!input.trim() || selectedImages.length > 0 || selectedPdfs.length > 0"
              :disabled="false"
              :is-busy="isChatBusy"
              :selected-images="selectedImages"
              :selected-pdfs="selectedPdfs"
              @send="handleSendMessage"
              @stop="chat.stop()"
              @trigger-image-upload="triggerImageUpload"
              @trigger-pdf-upload="triggerPdfUpload"
              @remove-image="removeImage"
              @remove-pdf="removePdf"
            />
            <p class="text-sm text-gray-500 mt-3">
              Ketik pesan dan tekan kirim untuk memulai chat baru
            </p>
          </div>
        </div>
      </div>

      <!-- Messages (Session Selected) -->
      <template v-else>
        <div ref="messagesContainerRef" class="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 custom-scrollbar">
          <!-- Loading State -->
          <div v-if="messagesPagination.loading && chat.messages.length === 0" class="flex flex-col items-center justify-center py-20">
            <Loader2Icon class="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p class="text-gray-500 font-medium">Memuat pesan...</p>
          </div>
          
          <template v-else>
            <!-- Messages Error -->
            <div v-if="messagesError" class="bg-red-50 border border-red-200 rounded-lg p-4">
              <p class="text-red-800">{{ messagesError.message }}</p>
            </div>

            <!-- Chat Error -->
            <div v-if="chatError" class="bg-red-50 border border-red-200 rounded-lg p-4">
              <p class="text-red-800">{{ chatError.message }}</p>
            </div>

            <!-- Load More Button -->
            <div v-if="messagesPagination.hasMore" class="flex justify-center">
              <button
                @click="handleLoadMoreMessages"
                :disabled="messagesPagination.loading"
                class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <Loader2Icon v-if="messagesPagination.loading" class="w-4 h-4 animate-spin" />
                <span v-else>Muat Lebih Lama</span>
              </button>
            </div>

            <!-- Messages List -->
            <ChatMessage
              v-for="(message, index) in chat.messages"
              :key="message.id || index"
              :message="message"
            />

            <!-- AI Typing Indicator -->
            <div v-if="isChatBusy && chat.status === 'submitted'" class="flex gap-3">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
                  <BotIcon class="w-4 h-4 text-white" />
                </div>
              </div>
              <div class="px-5 py-3 rounded-2xl shadow-sm bg-white border border-gray-200 rounded-tl-sm">
                <div class="flex items-center gap-2">
                  <Loader2Icon class="w-4 h-4 text-indigo-600 animate-spin" />
                  <span class="text-sm text-gray-600">Sedang berpikir...</span>
                </div>
              </div>
            </div>

            <!-- Empty State -->
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
        <ChatInput
          ref="chatInputRef"
          v-model="input"
          :can-send="canSendMessage"
          :disabled="!currentSessionId"
          :is-busy="isChatBusy"
          :selected-images="selectedImages"
          :selected-pdfs="selectedPdfs"
          @send="handleSendMessage"
          @stop="chat.stop()"
          @trigger-image-upload="triggerImageUpload"
          @trigger-pdf-upload="triggerPdfUpload"
          @remove-image="removeImage"
          @remove-pdf="removePdf"
        />
      </template>

      <!-- Hidden file inputs -->
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="handleImageSelect"
      />
      <input
        ref="pdfInputRef"
        type="file"
        accept="application/pdf"
        multiple
        class="hidden"
        @change="handlePdfSelect"
      />
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
