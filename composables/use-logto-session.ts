import { computed } from 'vue'
import { useRequestEvent, navigateTo, useCookie, useRuntimeConfig } from '#app'
import { getRequestURL } from 'h3'
import { useLogtoUser } from '#imports'
import {
  LOGTO_POST_CALLBACK_REDIRECT,
  LOGTO_REDIRECT_COOKIE,
  LOGTO_REDIRECT_FALLBACK,
  createRedirectCookieOptions,
  isReservedRedirectPath
} from '~/lib/logto/constants'

const SIGN_IN_PATH = '/sign-in'
const SIGN_OUT_PATH = '/sign-out'
const CALLBACK_PATH = '/callback'
const REDIRECT_QUERY_KEY = 'redirect'
export function useLogtoSession() {
  const rawUser = useLogtoUser()
  const runtimeConfig = useRuntimeConfig()
  const { logtoCookieSecure = false } = runtimeConfig.public ?? {}

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
    useCookie<string | null>(
      LOGTO_REDIRECT_COOKIE,
      createRedirectCookieOptions(logtoCookieSecure)
    )
  const buildInternalUrl = (
    pathname: string,
    { redirect, absolute = false }: { redirect?: string; absolute?: boolean } = {}
  ) => {
    const origin = process.server
      ? (() => {
          const event = useRequestEvent()
          if (!event) {
            throw new Error('Missing request event when building internal URL')
          }

          return getRequestURL(event).origin
        })()
      : window.location.origin

    const target = new URL(pathname, origin)

    if (typeof redirect === 'string') {
      target.searchParams.set(REDIRECT_QUERY_KEY, redirect)
    }

    return absolute ? target.toString() : target.pathname + target.search
  }

  const signIn = async (redirect?: string) => {
    const redirectValue = normalizedRedirect(redirect)
    const redirectCookie = resolveRedirectCookie()
    redirectCookie.value = redirectValue

    const target = buildInternalUrl(SIGN_IN_PATH, {
      redirect: redirectValue,
      absolute: process.client
    })

    if (process.client) {
      return navigateTo(target, { external: true, replace: true })
    }

    return navigateTo(target)
  }

  const signOut = async () => {
    const redirectCookie = resolveRedirectCookie()
    redirectCookie.value = null

    const target = buildInternalUrl(SIGN_OUT_PATH, {
      absolute: process.client
    })

    if (process.client) {
      return navigateTo(target, { external: true, replace: true })
    }

    return navigateTo(target)
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
