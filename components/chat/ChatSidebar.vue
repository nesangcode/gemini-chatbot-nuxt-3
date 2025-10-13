<template>
  <div :class="[
    'fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col shadow-xl transition-transform duration-300 ease-in-out',
    isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
  ]">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200/50">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <MessageSquareIcon class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <h1 class="text-lg font-bold text-gray-900 truncate">AI Kitalulus</h1>
            <p class="text-xs text-gray-500 truncate">{{ user?.name || user?.email }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- Close button (mobile only) -->
          <button
            @click="$emit('close')"
            class="lg:hidden text-gray-500 hover:text-gray-700 transition-colors p-1"
            title="Close"
          >
            <XIcon class="w-5 h-5" />
          </button>
          
          <!-- Sign out button -->
          <button
            @click="signOut"
            class="text-gray-500 hover:text-gray-700 transition-colors"
            title="Sign Out"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
      
      <button
        @click="$emit('create-chat')"
        class="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
      >
        <PlusIcon class="w-5 h-5" />
        Chat Baru
      </button>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 animate-fade-in">
      <div class="flex items-start gap-2">
        <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <div class="flex-1">
          <p class="text-sm text-red-800">{{ error.message }}</p>
        </div>
        <button @click="$emit('clear-error')" class="text-red-400 hover:text-red-600">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Chat Sessions List -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
      <div v-if="sessions.length === 0 && !loading" class="text-center py-8 text-gray-500">
        <MessageSquareIcon class="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p class="text-sm">Belum ada chat</p>
      </div>
      
      <div
        v-for="session in sessions"
        :key="session.id"
        :class="[
          'relative p-3 rounded-xl transition-all duration-200 group',
          currentSessionId === session.id
            ? 'bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 shadow-md'
            : 'bg-white/50 hover:bg-white border border-gray-200 hover:shadow-md'
        ]"
      >
        <button
          @click="$emit('select-session', session.id)"
          class="w-full text-left pr-8"
        >
          <div class="flex items-start gap-2">
            <div class="flex-1 min-w-0">
              <p :class="[
                'font-medium truncate',
                currentSessionId === session.id ? 'text-indigo-900' : 'text-gray-900'
              ]">
                {{ session.title }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ formatDate(session.updatedAt) }}
              </p>
            </div>
            
            <Loader2Icon
              v-if="loadingSessionId === session.id"
              class="w-5 h-5 text-indigo-600 animate-spin flex-shrink-0"
            />
          </div>
        </button>
        
        <button
          v-if="currentSessionId !== session.id"
          @click.stop="$emit('delete-session', session.id)"
          class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 rounded-lg z-10"
          title="Hapus chat"
        >
          <TrashIcon class="w-4 h-4 text-red-500" />
        </button>
      </div>

      <!-- Load More Button -->
      <div v-if="pagination.hasMore" class="pt-2">
        <button
          @click="$emit('load-more')"
          :disabled="pagination.loading"
          class="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loader2Icon v-if="pagination.loading" class="w-4 h-4 animate-spin" />
          <span v-else>Muat Lebih Banyak</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { MessageSquareIcon, PlusIcon, TrashIcon, Loader2Icon, XIcon } from 'lucide-vue-next'

defineProps({
  sessions: { type: Array, required: true },
  currentSessionId: { type: String, default: null },
  loadingSessionId: { type: String, default: null },
  loading: { type: Boolean, default: false },
  error: { type: Object, default: null },
  pagination: { type: Object, required: true },
  user: { type: Object, default: null },
  isOpen: { type: Boolean, default: false }
})

defineEmits(['create-chat', 'select-session', 'delete-session', 'load-more', 'clear-error', 'close'])

const { signOut } = useLogtoSession()

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Baru saja'
  if (diffMins < 60) return `${diffMins} menit yang lalu`
  if (diffHours < 24) return `${diffHours} jam yang lalu`
  if (diffDays < 7) return `${diffDays} hari yang lalu`
  
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

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
</style>
