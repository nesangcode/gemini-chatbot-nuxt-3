<script setup>
import { PlusIcon, SendIcon, MessageSquareIcon, SparklesIcon, UserCircle2Icon, BotIcon, Loader2Icon, TrashIcon } from 'lucide-vue-next'

definePageMeta({
  middleware: 'auth'
})

// Authentication
const { signOut, user } = useLogtoSession()

// Reactive state
const chatSessions = ref([])
const messages = ref([])
const currentSessionId = ref(null)
const currentSession = ref(null)
const inputMessage = ref('')
const isLoading = ref(false)
const messagesEndRef = ref(null)
const inputRef = ref(null)

// Fetch chat sessions on mount
onMounted(async () => {
  await fetchChatSessions()
})

// Auto-scroll to bottom when new messages arrive
watch(messages, () => {
  nextTick(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  })
}, { deep: true })

// Methods
async function fetchChatSessions() {
  try {
    const { data } = await $fetch('/api/chat/sessions')
    chatSessions.value = data || []
  } catch (error) {
    console.error('Error fetching chat sessions:', error)
  }
}

async function createNewChat() {
  try {
    const { data } = await $fetch('/api/chat/sessions', {
      method: 'POST'
    })
    
    chatSessions.value.unshift(data)
    await selectChatSession(data.id)
  } catch (error) {
    console.error('Error creating new chat:', error)
  }
}

async function selectChatSession(sessionId) {
  currentSessionId.value = sessionId
  currentSession.value = chatSessions.value.find(s => s.id === sessionId)
  
  try {
    const { data } = await $fetch(`/api/chat/sessions/${sessionId}/messages`)
    messages.value = data || []
  } catch (error) {
    console.error('Error fetching messages:', error)
    messages.value = []
  }
}

async function deleteSession(sessionId) {
  if (!confirm('Apakah Anda yakin ingin menghapus chat ini?')) {
    return
  }
  
  try {
    await $fetch(`/api/chat/sessions/${sessionId}`, {
      method: 'DELETE'
    })
    
    // Remove from list
    chatSessions.value = chatSessions.value.filter(s => s.id !== sessionId)
    
    // Clear current session if it was deleted
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = null
      currentSession.value = null
      messages.value = []
    }
  } catch (error) {
    console.error('Error deleting session:', error)
  }
}

async function sendMessage() {
  if (!inputMessage.value.trim() || !currentSessionId.value || isLoading.value) {
    return
  }

  const userMessage = inputMessage.value.trim()
  inputMessage.value = ''
  isLoading.value = true
  
  // Focus back on input
  nextTick(() => {
    inputRef.value?.focus()
  })

  // Check if this is the first message in the session
  const isFirstMessage = messages.value.length === 0

  // Add user message to UI immediately
  const userMsg = {
    id: Date.now().toString(),
    content: userMessage,
    role: 'user',
    createdAt: new Date().toISOString()
  }
  messages.value.push(userMsg)

  try {
    // Send message to API
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userMessage,
        sessionId: currentSessionId.value
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    // Handle streaming response
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    
    // Add AI message placeholder
    const aiMsg = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      createdAt: new Date().toISOString()
    }
    messages.value.push(aiMsg)

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                aiMsg.content += data.content
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    }

    // Auto-rename session after first AI response
    if (isFirstMessage && aiMsg.content.trim()) {
      await autoRenameSession()
    }

    // Refresh chat sessions to update timestamps
    await fetchChatSessions()
    
  } catch (error) {
    console.error('Error sending message:', error)
    // Remove the AI message placeholder on error
    messages.value.pop()
  } finally {
    isLoading.value = false
    // Focus back on input
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
}

async function autoRenameSession() {
  if (!currentSessionId.value) return
  
  try {
    const { data } = await $fetch(`/api/chat/sessions/${currentSessionId.value}/rename`, {
      method: 'POST'
    })
    
    // Update the session title in the UI
    if (data?.session) {
      const sessionIndex = chatSessions.value.findIndex(s => s.id === currentSessionId.value)
      if (sessionIndex !== -1) {
        chatSessions.value[sessionIndex].title = data.session.title
      }
      if (currentSession.value) {
        currentSession.value.title = data.session.title
      }
    }
  } catch (error) {
    console.error('Error auto-renaming session:', error)
    // Don't show error to user as this is a background operation
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } else {
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short' 
    })
  }
}

function formatMessage(content) {
  // Simple markdown-like formatting
  return content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 rounded text-sm">$1</code>')
}

function autoResize(event) {
  const textarea = event.target
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
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
              <MessageSquareIcon class="w-4 h-4 mt-1 flex-shrink-0" :class="currentSessionId === session.id ? 'text-indigo-600' : 'text-gray-400'" />
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
        
        <div v-if="chatSessions.length === 0" class="text-center text-gray-500 py-12">
          <MessageSquareIcon class="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p class="text-sm">Belum ada riwayat chat</p>
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
        <div
          v-for="message in messages"
          :key="message.id"
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
            <div class="prose prose-sm max-w-none" :class="message.role === 'user' ? 'prose-invert' : ''">
              <div class="whitespace-pre-wrap leading-relaxed" v-html="formatMessage(message.content)"></div>
            </div>
          </div>
          
          <!-- User Avatar -->
          <div v-if="message.role === 'user'" class="flex-shrink-0">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
              <UserCircle2Icon class="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        
        <!-- Loading indicator -->
        <div v-if="isLoading" class="flex gap-3 animate-fade-in">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
            <BotIcon class="w-4 h-4 text-white" />
          </div>
          <div class="bg-white border border-gray-200 px-5 py-3 rounded-2xl rounded-tl-sm shadow-sm">
            <div class="flex items-center gap-2">
              <Loader2Icon class="w-4 h-4 animate-spin text-indigo-600" />
              <span class="text-sm text-gray-600">Sedang mengetik...</span>
            </div>
          </div>
        </div>
        
        <div v-if="messages.length === 0 && currentSessionId" class="flex flex-col items-center justify-center py-20 text-center">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center mb-4">
            <SparklesIcon class="w-10 h-10 text-indigo-600" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Mulai Percakapan</h3>
          <p class="text-gray-500 max-w-md">Tanyakan apa saja kepada Gemini AI. Saya siap membantu Anda!</p>
        </div>
        
        <div ref="messagesEndRef"></div>
      </div>

      <!-- Input Area -->
      <div class="bg-white/80 backdrop-blur-xl border-t border-gray-200/50 p-4 shadow-lg">
        <div class="max-w-4xl mx-auto">
          <div class="flex gap-3 items-end">
            <div class="flex-1 relative">
              <textarea
                ref="inputRef"
                v-model="inputMessage"
                @keydown.enter.exact.prevent="sendMessage"
                :disabled="isLoading || !currentSessionId"
                placeholder="Ketik pesan Anda... (Enter untuk kirim)"
                rows="1"
                class="w-full px-5 py-3 pr-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 resize-none transition-all duration-200 shadow-sm hover:shadow-md"
                style="max-height: 150px; min-height: 48px;"
                @input="autoResize"
              />
            </div>
            <button
              @click="sendMessage"
              :disabled="isLoading || !inputMessage.trim() || !currentSessionId"
              class="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium p-3 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed min-w-[48px]"
            >
              <SendIcon class="w-5 h-5" />
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-2 text-center">Gemini dapat membuat kesalahan. Periksa informasi penting.</p>
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
