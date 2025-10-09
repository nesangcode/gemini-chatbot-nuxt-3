// /middleware/auth.ts
import { abortNavigation, navigateTo } from '#app'

export default defineNuxtRouteMiddleware(async (to) => {
  // 1) Allow public routes
    const publicPaths = ['/', '/sign-in', '/callback', '/callback/continue']
  if (publicPaths.some(p => to.path.startsWith(p))) return

  // 2) Never call signIn() on the server.
  //    If you want SSR redirect, send to a public /login page instead.
  if (process.server) {
    // (Optional) If you can read your session cookie here, do it.
    // Otherwise just push to /login and let the client do signIn().
    return navigateTo('/login', { redirectCode: 302 })
  }

  // 3) Client-side: wait for session hydration before deciding
  const { isAuthenticated, isLoading, signIn } = useLogtoSession() as {
    isAuthenticated: Ref<boolean>
    isLoading?: Ref<boolean>
    signIn: (returnTo?: string) => Promise<void>
  }

  // Avoid eager redirect while the SDK is still hydrating
  if (isLoading?.value) {
    // wait a tick or two
    while (isLoading.value) {
      await new Promise(r => requestAnimationFrame(r))
    }
  }

  if (!isAuthenticated.value) {
    // Guard against double-calls
    if (typeof window !== 'undefined' && (window as any).__logtoRedirecting) {
      return abortNavigation()
    }
    ;(window as any).__logtoRedirecting = true
    await signIn(to.fullPath)
    return abortNavigation()
  }
})
