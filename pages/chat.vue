<script setup>
import { PlusIcon, SendIcon } from 'lucide-vue-next'

definePageMeta({
  middleware: 'auth'
})

// Authentication
const { isAuthenticated, signOut, user } = useLogto()

// Redirect if not authenticated
if (!isAuthenticated.value) {
  await navigateTo('/')
}

// Reactive state
const chatSessions = ref([])
const messages = ref([])
const currentSessionId = ref(null)
const currentSession = ref(null)
const inputMessage = ref('')
const isLoading = ref(false)

// Fetch chat sessions on mount
onMounted(async () => {
  await fetchChatSessions()
})

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

async function sendMessage() {
  if (!inputMessage.value.trim() || !currentSessionId.value || isLoading.value) {
    return
  }

  const userMessage = inputMessage.value.trim()
  inputMessage.value = ''
  isLoading.value = true

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
</script>

<template>
  <div class="h-screen flex bg-gray-50">
    <!-- Sidebar -->
    <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-xl font-semibold text-gray-900">Chat History</h1>
          <button
            @click="signOut"
            class="text-gray-500 hover:text-gray-700 text-sm"
          >
            Keluar
          </button>
        </div>
        <button
          @click="createNewChat"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <PlusIcon class="w-4 h-4" />
          Chat Baru
        </button>
      </div>

      <!-- Chat Sessions List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-2">
        <div
          v-for="session in chatSessions"
          :key="session.id"
          @click="selectChatSession(session.id)"
          :class="[
            'p-3 rounded-lg cursor-pointer transition-colors',
            currentSessionId === session.id
              ? 'bg-blue-100 border border-blue-200'
              : 'hover:bg-gray-100'
          ]"
        >
          <h3 class="font-medium text-gray-900 truncate">{{ session.title }}</h3>
          <p class="text-sm text-gray-500">
            {{ formatDate(session.updatedAt) }}
          </p>
        </div>
        
        <div v-if="chatSessions.length === 0" class="text-center text-gray-500 py-8">
          Belum ada riwayat chat
        </div>
      </div>
    </div>

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col">
      <!-- Chat Header -->
      <div class="bg-white border-b border-gray-200 p-4">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ currentSession?.title || 'Pilih atau buat chat baru' }}
        </h2>
      </div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="[
            'flex',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          ]"
        >
          <div
            :class="[
              'max-w-3xl px-4 py-2 rounded-lg',
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-900'
            ]"
          >
            <div class="whitespace-pre-wrap">{{ message.content }}</div>
          </div>
        </div>
        
        <div v-if="messages.length === 0 && currentSessionId" class="text-center text-gray-500 py-8">
          Mulai percakapan dengan mengirim pesan
        </div>
      </div>

      <!-- Input Area -->
      <div class="bg-white border-t border-gray-200 p-4">
        <div class="flex gap-2">
          <input
            v-model="inputMessage"
            @keydown.enter="sendMessage"
            :disabled="isLoading || !currentSessionId"
            placeholder="Ketik pesan Anda..."
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            @click="sendMessage"
            :disabled="isLoading || !inputMessage.trim() || !currentSessionId"
            class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            <SendIcon class="w-4 h-4" />
            <span v-if="!isLoading">Kirim</span>
            <span v-else>Mengirim...</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>