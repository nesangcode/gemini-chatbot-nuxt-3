<script setup>
import {
  LOGTO_REDIRECT_COOKIE,
  LOGTO_REDIRECT_FALLBACK,
  createRedirectCookieOptions,
  isReservedRedirectPath
} from '~/lib/logto/constants'

const { isAuthenticated, signIn } = useLogto()
const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const { logtoCookieSecure = false } = runtimeConfig.public ?? {}
const redirectCookie = useCookie<string | null>(
  LOGTO_REDIRECT_COOKIE,
  createRedirectCookieOptions(logtoCookieSecure)
)

const redirectPath = computed(() => {
  const redirect = route.query.redirect

  if (typeof redirect === 'string' && redirect.startsWith('/') && !isReservedRedirectPath(redirect)) {
    return redirect
  }

  return LOGTO_REDIRECT_FALLBACK
})

const errorMessage = ref('')
const isDebugMode = computed(() => 'debug' in route.query)
const debugState = computed(() => ({
  redirectQuery: route.query.redirect ?? null,
  normalizedRedirect: redirectPath.value,
  storedRedirectCookie: redirectCookie.value,
  isAuthenticated: isAuthenticated.value
}))
const debugSnapshot = computed(() => JSON.stringify(debugState.value, null, 2))

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
  if (isDebugMode.value) {
    console.debug('[Logto][sign-in] Debug snapshot', {
      ...debugState.value,
      timestamp: new Date().toISOString()
    })
    return
  }

  startSignIn()
})

const clearRedirectCookie = () => {
  redirectCookie.value = null
}
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

      <div
        v-if="isDebugMode"
        class="bg-gray-50 border border-gray-200 text-left text-xs font-mono px-4 py-3 rounded-lg space-y-2"
      >
        <div class="flex items-center justify-between">
          <span class="text-gray-600 font-semibold">Debug mode aktif</span>
          <button
            type="button"
            class="text-blue-600 hover:underline"
            @click="clearRedirectCookie"
          >
            Hapus cookie redirect
          </button>
        </div>
        <pre class="whitespace-pre-wrap text-gray-700">{{ debugSnapshot }}</pre>
        <p class="text-gray-500">Jalankan tombol di bawah untuk mencoba proses masuk secara manual.</p>
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
