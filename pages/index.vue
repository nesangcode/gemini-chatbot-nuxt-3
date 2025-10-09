<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Animated background elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-20 left-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div class="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div class="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>

    <div class="max-w-md w-full space-y-8 relative z-10">
      <div class="text-center">
        <!-- Logo/Icon -->
        <div class="flex justify-center mb-6">
          <div class="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/50 animate-float">
            <SparklesIcon class="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 class="text-5xl font-bold mb-3">
          <span class="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gemini Chatbot
          </span>
        </h1>
        <p class="text-gray-600 mb-8 text-lg">Berinteraksi dengan AI menggunakan Google Gemini 2.5 Pro</p>

        <!-- Features -->
        <div class="grid grid-cols-1 gap-3 mb-8 text-left">
          <div class="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-gray-200/50 shadow-sm">
            <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquareIcon class="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p class="font-medium text-gray-900 text-sm">Chat Interaktif</p>
              <p class="text-xs text-gray-600">Percakapan real-time dengan AI</p>
            </div>
          </div>
          <div class="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-gray-200/50 shadow-sm">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BotIcon class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p class="font-medium text-gray-900 text-sm">AI Canggih</p>
              <p class="text-xs text-gray-600">Powered by Gemini 2.5 Pro</p>
            </div>
          </div>
          <div class="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-gray-200/50 shadow-sm">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <HistoryIcon class="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p class="font-medium text-gray-900 text-sm">Riwayat Tersimpan</p>
              <p class="text-xs text-gray-600">Akses chat sebelumnya kapan saja</p>
            </div>
          </div>
        </div>

        <div v-if="!isAuthenticated" class="space-y-4">
          <button
            @click="handleSignIn"
            class="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <LogInIcon class="w-5 h-5" />
            Masuk dengan Logto
          </button>
          <p class="text-xs text-gray-500">Aman dan terpercaya dengan autentikasi Logto</p>
        </div>

        <div v-else class="space-y-4">
          <div class="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
            <p class="text-green-700 font-semibold flex items-center justify-center gap-2">
              <CheckCircleIcon class="w-5 h-5" />
              Selamat datang kembali!
            </p>
          </div>
          <button
            @click="navigateTo('/chat')"
            class="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 shadow-xl shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/40 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <ArrowRightIcon class="w-5 h-5" />
            Mulai Chat
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SparklesIcon, MessageSquareIcon, BotIcon, HistoryIcon, LogInIcon, CheckCircleIcon, ArrowRightIcon } from 'lucide-vue-next'
import { useLogtoUser, useLogtoSession } from '#imports'

const user = useLogtoUser()
const isAuthenticated = computed(() => Boolean(user?.value))

const { signIn } = useLogtoSession()
const handleSignIn = () => {
  // after login, return to /chat
  signIn('/chat')
}

// Optional: auto-redirect when already logged in
watchEffect(() => {
  if (isAuthenticated.value) navigateTo('/chat')
})
</script>

<style scoped>
@keyframes blob {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>
