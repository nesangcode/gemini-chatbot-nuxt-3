import type { CookieOptions } from 'h3'

export const LOGTO_REDIRECT_COOKIE = 'logto:redirect-path' as const
export const LOGTO_REDIRECT_COOKIE_MAX_AGE = 60 * 10
export const LOGTO_REDIRECT_FALLBACK = '/chat' as const
export const LOGTO_POST_CALLBACK_REDIRECT = '/callback/continue' as const

export const LOGTO_RESERVED_REDIRECT_PREFIXES = [
  '/sign-in',
  '/sign-out',
  '/callback',
  LOGTO_POST_CALLBACK_REDIRECT
] as const

export const isReservedRedirectPath = (pathname: string) =>
  LOGTO_RESERVED_REDIRECT_PREFIXES.some(prefix =>
    pathname === prefix || pathname.startsWith(`${prefix}?`)
  )

export const createRedirectCookieOptions = (secure: boolean): CookieOptions => ({
  sameSite: 'lax',
  path: '/',
  secure,
  maxAge: LOGTO_REDIRECT_COOKIE_MAX_AGE
})
