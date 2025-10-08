<script setup lang="ts">
import {
  LOGTO_REDIRECT_COOKIE,
  LOGTO_REDIRECT_FALLBACK,
  createRedirectCookieOptions,
  isReservedRedirectPath
} from '~/lib/logto/constants'

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const { logtoCookieSecure = false } = runtimeConfig.public ?? {}
const redirectCookie = useCookie<string | null>(
  LOGTO_REDIRECT_COOKIE,
  createRedirectCookieOptions(logtoCookieSecure)
)

const hasError = computed(() => typeof route.query.error === 'string')
const errorDescription = computed(() => {
  if (!hasError.value) {
    return ''
  }

  const description = route.query.error_description
  return typeof description === 'string'
    ? description
    : 'Proses masuk dibatalkan. Silakan coba lagi.'
})

const resolvedRedirect = computed(() => {
  const candidates = [redirectCookie.value, route.query.redirect]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.startsWith('/') && !isReservedRedirectPath(candidate)) {
      return candidate
    }
  }

  return LOGTO_REDIRECT_FALLBACK
})

let redirectTimer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  if (hasError.value) {
    redirectCookie.value = null
    return
  }

  const target = resolvedRedirect.value
  redirectCookie.value = null

  redirectTimer = setTimeout(() => {
    navigateTo(target, { replace: true })
  }, 1200)
})

onBeforeUnmount(() => {
  if (redirectTimer) {
    clearTimeout(redirectTimer)
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 space-y-5 text-center">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">
          Menyelesaikan proses masuk
        </h1>
        <p v-if="!hasError" class="mt-2 text-gray-600">
          Harap tunggu, kami sedang memverifikasi sesi Anda.
        </p>
      </div>

      <div
        v-if="hasError"
        class="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg"
      >
        {{ errorDescription }}
      </div>

      <NuxtLink
        v-if="hasError"
        to="/sign-in"
        class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Coba masuk lagi
      </NuxtLink>

      <p v-else class="text-sm text-gray-500">
        Anda akan dialihkan ke halaman yang diminta secara otomatis.
      </p>

      <NuxtLink
        v-if="!hasError"
        :to="resolvedRedirect"
        class="text-sm text-blue-600 hover:underline block"
      >
        Buka sekarang
      </NuxtLink>
    </div>
  </div>
</template>
