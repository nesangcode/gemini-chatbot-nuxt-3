<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div class="max-w-md w-full space-y-8 p-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">
          Gemini Chatbot
        </h1>
        <p class="text-gray-600 mb-8">
          Berinteraksi dengan AI menggunakan Google Gemini 2.5 Pro
        </p>
        
        <div v-if="!isAuthenticated" class="space-y-4">
          <button
            @click="signIn"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Masuk dengan Logto
          </button>
        </div>
        
        <div v-else class="space-y-4">
          <p class="text-green-600 font-medium">
            Selamat datang kembali!
          </p>
          <button
            @click="navigateTo('/chat')"
            class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Mulai Chat
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useLogtoUser } from '#imports';

const user = useLogtoUser();
const isAuthenticated = computed(() => Boolean(user?.value));

const signIn = () => {
  navigateTo('/sign-in');
};

// Redirect authenticated users to chat
watchEffect(() => {
  if (isAuthenticated.value) {
    navigateTo('/chat');
  }
});
</script>
