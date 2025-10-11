<script setup>
import { PlusIcon, SendIcon, MessageSquareIcon, SparklesIcon, UserCircle2Icon, BotIcon, Loader2Icon, TrashIcon, SquareIcon } from 'lucide-vue-next'
import { Chat } from '@ai-sdk/vue'

definePageMeta({
  middleware: 'auth'
})

// Authentication
const { signOut, user } = useLogtoSession()

// Chat sessions state
const currentSessionId = ref(null)
const currentSession = ref(null)

const headers = useRequestHeaders(['cookie'])
const { data: chatSessions, refresh: fetchChatSessions } = await useAsyncData(
  'chat-sessions',
  () => $fetch('/api/chat/sessions', { headers }),
  {
    default: () => [],
    transform: (response) => response.data || [],
  }
)

// UI refs
const messagesEndRef = ref(null)
const inputRef = ref(null)

// Composables
const chat = new Chat({
  api: '/api/chat',
  streamProtocol: 'text',
  body: computed(() => ({
    sessionId: currentSessionId.value
  })),
  onFinish: async () => {
    // Refresh chat sessions to update timestamps and titles
    await fetchChatSessions()
  }
})

const isChatStreaming = ref(false)
const isChatBusy = computed(() => chat.isLoading || isChatStreaming.value)

const input = ref('')
const canSendMessage = computed(() => !!input.value.trim() && !!currentSessionId.value && !isChatBusy.value)


// Pagination state
const messagesPagination = ref({
  total: 0,
  limit: 20,
  offset: 0,
  cursor: null,
  hasMore: false,
  loading: false
})


// Auto-scroll to bottom when new messages arrive
watch(chat.messages, () => {
  nextTick(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  })
}, { deep: true })

// Methods

async function createNewChat() {
  try {
    const response = await $fetch('/api/chat/sessions', {
      method: 'POST'
    })
    
    if (response.data) {
      chatSessions.value.unshift(response.data)
      await selectChatSession(response.data.id)
    }
  } catch (error) {
    console.error('Error creating new chat:', error)
  }
}

async function selectChatSession(sessionId) {
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
    
    const response = await $fetch(`/api/chat/sessions/${sessionId}/messages?limit=20`)
    
    if (response?.success && response?.data) {
      chat.messages = response.data
      messagesPagination.value = {
        ...messagesPagination.value,
        ...response.pagination,
        loading: false
      }
    } else {
      chat.messages = []
    }
  } catch (error) {
    console.error('Error fetching messages:', error)
    chat.messages = []
    messagesPagination.value.loading = false
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
      chat.messages = [...response.data, ...chat.messages]
      messagesPagination.value = {
        ...messagesPagination.value,
        ...response.pagination,
        loading: false,
      }
    }
  } catch (error) {
    console.error('Error loading more messages:', error)
    messagesPagination.value.loading = false
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
      chat.messages = []
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
    console.error('Error deleting session:', error)
  }
}

async function handleSendMessage() {
  if (!input.value.trim() || !currentSessionId.value || chat.isLoading || isChatStreaming.value) {
    return
  }

  isChatStreaming.value = true

  try {
    await chat.sendMessage(
      { text: input.value },
      {
        body: {
          sessionId: currentSessionId.value,
        },
      }
    )
    await selectChatSession(currentSessionId.value)
    input.value = ''
  } catch (error) {
    console.error('Error sending message:', error)
  } finally {
    isChatStreaming.value = false

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

function autoResize(event) {
  const textarea = event.target
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
}

function onInput(event) {
  autoResize(event)
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
        <!-- Error Alert -->
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
            <div 
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
      </div>

      <!-- Input Area -->
      <div class="bg-white/80 backdrop-blur-xl border-t border-gray-200/50 p-4 shadow-lg">
        <div class="max-w-4xl mx-auto">
          <div class="flex gap-3 items-center">
            <div class="flex-1 relative">
              <form @submit.prevent="handleSendMessage">
                <textarea
                  ref="inputRef"
                  v-model="input"
                  @input="onInput"
                  @keydown.enter.exact.prevent="handleSendMessage"
                  :disabled="isChatBusy || !currentSessionId"
                  placeholder="Ketik pesan Anda... (Enter untuk kirim)"
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
