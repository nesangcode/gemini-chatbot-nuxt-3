import { LOGTO_POST_CALLBACK_REDIRECT } from './lib/logto/constants'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    '@logto/nuxt'
  ],

  // Enable pages directory
  pages: true,

  // Netlify deployment configuration
  nitro: {
    preset: 'netlify',
    experimental: {
      wasm: true
    },
    rollupConfig: {
      external: ['@prisma/client']
    }
  },

  runtimeConfig: {
    // Private keys (only available on server-side)
    geminiApiKey: process.env.GEMINI_API_KEY,
    databaseUrl: process.env.DATABASE_URL,
    logtoAppSecret: process.env.LOGTO_APP_SECRET,
    logto: {
      endpoint: process.env.LOGTO_ENDPOINT,
      appId: process.env.LOGTO_APP_ID,
      appSecret: process.env.LOGTO_APP_SECRET,
      cookieEncryptionKey: process.env.LOGTO_COOKIE_ENCRYPTION_KEY,
      postCallbackRedirectUri: LOGTO_POST_CALLBACK_REDIRECT,
      postLogoutRedirectUri: '/',
      cookieSecure: process.env.NODE_ENV === 'production',
      customRedirectBaseUrl: process.env.LOGTO_BASE_URL ?? 'http://localhost:3000'
    },
    
    // Public keys (exposed to client-side)
    public: {
      logtoEndpoint: process.env.LOGTO_ENDPOINT,
      logtoAppId: process.env.LOGTO_APP_ID
    }
  }
})
