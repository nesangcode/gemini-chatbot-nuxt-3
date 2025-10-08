<script setup>
import { LOGTO_REDIRECT_FALLBACK, isReservedRedirectPath } from '~/lib/logto/constants'

const { isAuthenticated, signIn } = useLogto()
const route = useRoute()

const redirectPath = computed(() => {
  const redirect = route.query.redirect

  if (typeof redirect === 'string' && redirect.startsWith('/') && !isReservedRedirectPath(redirect)) {
    return redirect
  }

  return LOGTO_REDIRECT_FALLBACK
})

const errorMessage = ref('')

const startSignIn = async () => {
  if (isAuthenticated.value) {
    await navigateTo(redirectPath.value)
    return
  }

  try {
    await signIn(redirectPath.value)
  } catch (error) {
    console.error('Logto sign-in failed:', error)
    errorMessage.value = 'Tidak dapat memulai proses masuk. Silakan coba lagi.'
  }
}

onMounted(() => {
  startSignIn()
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 space-y-6 text-center">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Mengalihkan ke Logto</h1>
        <p class="mt-2 text-gray-600">
          Harap tunggu sebentar, kami sedang menyiapkan proses masuk Anda.
        </p>
      </div>

      <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
        {{ errorMessage }}
      </div>

      <button
        type="button"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        @click="startSignIn"
      >
        Coba lagi
      </button>

      <NuxtLink to="/" class="text-sm text-blue-600 hover:underline block">
        Kembali ke beranda
      </NuxtLink>
    </div>
  </div>
</template>
