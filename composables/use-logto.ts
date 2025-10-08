import { computed } from 'vue'
import { useRequestEvent, navigateTo } from '#app'
import { getRequestURL } from 'h3'
import { useLogtoUser } from '#imports'

const SIGN_IN_PATH = '/sign-in'
const SIGN_OUT_PATH = '/sign-out'
const CALLBACK_PATH = '/callback'
const REDIRECT_QUERY_KEY = 'redirect'

export function useLogto() {
  const rawUser = useLogtoUser()

  const user = computed(() => rawUser?.value)
  const isAuthenticated = computed(() => Boolean(user.value))

  const normalizedRedirect = (redirect?: string) => {
    if (typeof redirect !== 'string' || !redirect.startsWith('/')) {
      return '/chat'
    }
    return redirect
  }

  const buildRedirectUrl = (pathname: string, redirect?: string) => {
    const redirectValue = normalizedRedirect(redirect)

    if (process.server) {
      const event = useRequestEvent()
      const requestUrl = getRequestURL(event)
      const target = new URL(pathname, requestUrl.origin)
      target.searchParams.set(REDIRECT_QUERY_KEY, redirectValue)
      return target.pathname + target.search
    }

    const target = new URL(pathname, window.location.origin)
    target.searchParams.set(REDIRECT_QUERY_KEY, redirectValue)
    return target.pathname + target.search
  }

  const signIn = async (redirect?: string) => {
    const target = buildRedirectUrl(SIGN_IN_PATH, redirect)

    if (process.server) {
      return navigateTo(target)
    }

    window.location.assign(target)
  }

  const signOut = async () => {
    if (process.server) {
      return navigateTo(SIGN_OUT_PATH)
    }

    window.location.assign(SIGN_OUT_PATH)
  }

  return { user, isAuthenticated, signIn, signOut, callbackPath: CALLBACK_PATH }
}
