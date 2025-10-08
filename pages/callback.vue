<script setup>
const route = useRoute()

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

const redirectPath = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/')
    ? redirect
    : '/chat'
})

let redirectTimer

onMounted(() => {
  if (hasError.value) {
    return
  }

  redirectTimer = setTimeout(() => {
    navigateTo(redirectPath.value, { replace: true })
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
        Anda akan dialihkan ke halaman chat secara otomatis.
      </p>
    </div>
  </div>
</template>
