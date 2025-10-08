import { computed } from 'vue'
import { useRequestEvent, navigateTo, useCookie } from '#app'
import { getRequestURL } from 'h3'
import { useLogtoUser } from '#imports'
import {
  LOGTO_POST_CALLBACK_REDIRECT,
  LOGTO_REDIRECT_COOKIE,
  LOGTO_REDIRECT_FALLBACK,
  isReservedRedirectPath
} from '~/lib/logto/constants'

const SIGN_IN_PATH = '/sign-in'
const SIGN_OUT_PATH = '/sign-out'
const CALLBACK_PATH = '/callback'
const REDIRECT_QUERY_KEY = 'redirect'
const REDIRECT_COOKIE_OPTIONS = {
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 10
}

export function useLogto() {
  const rawUser = useLogtoUser()

  const user = computed(() => rawUser?.value)
  const isAuthenticated = computed(() => Boolean(user.value))

  const normalizedRedirect = (redirect?: string) => {
    if (typeof redirect !== 'string' || !redirect.startsWith('/')) {
      return LOGTO_REDIRECT_FALLBACK
    }

    if (isReservedRedirectPath(redirect)) {
      return LOGTO_REDIRECT_FALLBACK
    }

    return redirect
  }

  const resolveRedirectCookie = () =>
    useCookie<string | null>(LOGTO_REDIRECT_COOKIE, REDIRECT_COOKIE_OPTIONS)

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
    const redirectValue = normalizedRedirect(redirect)
    const redirectCookie = resolveRedirectCookie()
    redirectCookie.value = redirectValue

    const target = buildRedirectUrl(SIGN_IN_PATH, redirectValue)

    if (process.server) {
      return navigateTo(target)
    }

    window.location.assign(target)
  }

  const signOut = async () => {
    const redirectCookie = resolveRedirectCookie()
    redirectCookie.value = null

    if (process.server) {
      return navigateTo(SIGN_OUT_PATH)
    }

    window.location.assign(SIGN_OUT_PATH)
  }

  return {
    user,
    isAuthenticated,
    signIn,
    signOut,
    callbackPath: CALLBACK_PATH,
    postCallbackRedirectPath: LOGTO_POST_CALLBACK_REDIRECT
  }
}
