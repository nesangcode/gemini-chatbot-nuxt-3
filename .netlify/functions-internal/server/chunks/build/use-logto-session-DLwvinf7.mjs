import { computed, shallowRef } from 'vue';
import { c as useRuntimeConfig, a as useNuxtApp, d as useState, n as navigateTo } from './server.mjs';
import { X as getRequestURL } from '../_/nitro.mjs';
import { a as useCookie, c as useRequestEvent } from './cookie-B5htYsqW.mjs';

const LOGTO_REDIRECT_COOKIE = "logto:redirect-path";
const LOGTO_REDIRECT_COOKIE_MAX_AGE = 60 * 10;
const LOGTO_REDIRECT_FALLBACK = "/chat";
const LOGTO_POST_CALLBACK_REDIRECT = "/callback/continue";
const LOGTO_RESERVED_REDIRECT_PREFIXES = [
  "/sign-in",
  "/sign-out",
  "/callback",
  LOGTO_POST_CALLBACK_REDIRECT
];
const isReservedRedirectPath = (pathname) => LOGTO_RESERVED_REDIRECT_PREFIXES.some(
  (prefix) => pathname === prefix || pathname.startsWith(`${prefix}?`)
);
const createRedirectCookieOptions = (secure) => ({
  sameSite: "lax",
  path: "/",
  secure,
  maxAge: LOGTO_REDIRECT_COOKIE_MAX_AGE
});
var LogtoStateKey = /* @__PURE__ */ ((LogtoStateKey2) => {
  LogtoStateKey2["User"] = "logto.user";
  return LogtoStateKey2;
})(LogtoStateKey || {});
function useLogtoUser() {
  const nuxtApp = useNuxtApp();
  const user = useState(
    LogtoStateKey.User,
    () => {
      var _a;
      return shallowRef((_a = nuxtApp.ssrContext) == null ? void 0 : _a.event.context.logtoUser);
    }
  );
  return user.value;
}
const SIGN_IN_PATH = "/sign-in";
const SIGN_OUT_PATH = "/sign-out";
const CALLBACK_PATH = "/callback";
const REDIRECT_QUERY_KEY = "redirect";
function useLogtoSession() {
  var _a;
  const rawUser = useLogtoUser();
  const runtimeConfig = useRuntimeConfig();
  const { logtoCookieSecure = false } = (_a = runtimeConfig.public) != null ? _a : {};
  const user = computed(() => rawUser == null ? void 0 : rawUser.value);
  const isAuthenticated = computed(() => Boolean(user.value));
  const normalizedRedirect = (redirect) => {
    if (typeof redirect !== "string" || !redirect.startsWith("/")) {
      return LOGTO_REDIRECT_FALLBACK;
    }
    if (isReservedRedirectPath(redirect)) {
      return LOGTO_REDIRECT_FALLBACK;
    }
    return redirect;
  };
  const resolveRedirectCookie = () => useCookie(
    LOGTO_REDIRECT_COOKIE,
    createRedirectCookieOptions(logtoCookieSecure)
  );
  const buildInternalUrl = (pathname, { redirect, absolute = false } = {}) => {
    const origin = (() => {
      const event = useRequestEvent();
      if (!event) {
        throw new Error("Missing request event when building internal URL");
      }
      return getRequestURL(event).origin;
    })();
    const target = new URL(pathname, origin);
    if (typeof redirect === "string") {
      target.searchParams.set(REDIRECT_QUERY_KEY, redirect);
    }
    return absolute ? target.toString() : target.pathname + target.search;
  };
  const signIn = async (redirect) => {
    const redirectValue = normalizedRedirect(redirect);
    const redirectCookie = resolveRedirectCookie();
    redirectCookie.value = redirectValue;
    const target = buildInternalUrl(SIGN_IN_PATH, {
      redirect: redirectValue,
      absolute: false
    });
    return navigateTo(target);
  };
  const signOut = async () => {
    const redirectCookie = resolveRedirectCookie();
    redirectCookie.value = null;
    const target = buildInternalUrl(SIGN_OUT_PATH, {
      absolute: false
    });
    return navigateTo(target);
  };
  return {
    user,
    isAuthenticated,
    signIn,
    signOut,
    callbackPath: CALLBACK_PATH,
    postCallbackRedirectPath: LOGTO_POST_CALLBACK_REDIRECT
  };
}

export { LOGTO_REDIRECT_FALLBACK as L, useLogtoUser as a, LOGTO_REDIRECT_COOKIE as b, createRedirectCookieOptions as c, isReservedRedirectPath as i, useLogtoSession as u };
//# sourceMappingURL=use-logto-session-DLwvinf7.mjs.map
