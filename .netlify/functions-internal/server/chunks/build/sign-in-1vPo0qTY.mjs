import { _ as __nuxt_component_0 } from './nuxt-link--yPzeJO7.mjs';
import { computed, ref, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
import { u as useLogtoSession, c as createRedirectCookieOptions, i as isReservedRedirectPath, L as LOGTO_REDIRECT_FALLBACK } from './use-logto-session-DLwvinf7.mjs';
import { b as useRoute, c as useRuntimeConfig } from './server.mjs';
import { a as useCookie } from './cookie-B5htYsqW.mjs';
import '../_/nitro.mjs';
import 'unified';
import 'remark-parse';
import 'remark-rehype';
import 'remark-mdc';
import 'remark-gfm';
import 'rehype-external-links';
import 'rehype-sort-attribute-values';
import 'rehype-sort-attributes';
import 'rehype-raw';
import 'detab';
import 'micromark-util-sanitize-uri';
import 'hast-util-to-string';
import 'github-slugger';
import 'node:module';
import '@ai-sdk/google';
import 'ai';
import '@prisma/client';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import '@iconify/utils';
import 'node:crypto';
import 'consola';
import '@logto/node';
import '@silverhand/essentials';
import 'node:url';
import 'ipx';
import 'node:fs';
import 'node:path';
import 'vue-router';
import 'tailwind-merge';
import '@iconify/vue';
import 'markdown-it';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';

const _sfc_main = {
  __name: "sign-in",
  __ssrInlineRender: true,
  setup(__props) {
    var _a;
    const { isAuthenticated } = useLogtoSession();
    const route = useRoute();
    const runtimeConfig = useRuntimeConfig();
    const { logtoCookieSecure = false } = (_a = runtimeConfig.public) != null ? _a : {};
    const redirectCookie = useCookie < string | null > createRedirectCookieOptions(logtoCookieSecure);
    const redirectPath = computed(() => {
      const redirect = route.query.redirect;
      if (typeof redirect === "string" && redirect.startsWith("/") && !isReservedRedirectPath(redirect)) {
        return redirect;
      }
      return LOGTO_REDIRECT_FALLBACK;
    });
    const errorMessage = ref("");
    const isDebugMode = computed(() => "debug" in route.query);
    const debugState = computed(() => {
      var _a2;
      return {
        redirectQuery: (_a2 = route.query.redirect) != null ? _a2 : null,
        normalizedRedirect: redirectPath.value,
        storedRedirectCookie: redirectCookie.value,
        isAuthenticated: isAuthenticated.value
      };
    });
    const debugSnapshot = computed(() => JSON.stringify(debugState.value, null, 2));
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100" }, _attrs))}><div class="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 space-y-6 text-center"><div><h1 class="text-2xl font-semibold text-gray-900">Mengalihkan ke Logto</h1><p class="mt-2 text-gray-600"> Harap tunggu sebentar, kami sedang menyiapkan proses masuk Anda. </p></div>`);
      if (unref(errorMessage)) {
        _push(`<div class="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">${ssrInterpolate(unref(errorMessage))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(isDebugMode)) {
        _push(`<div class="bg-gray-50 border border-gray-200 text-left text-xs font-mono px-4 py-3 rounded-lg space-y-2"><div class="flex items-center justify-between"><span class="text-gray-600 font-semibold">Debug mode aktif</span><button type="button" class="text-blue-600 hover:underline"> Hapus cookie redirect </button></div><pre class="whitespace-pre-wrap text-gray-700">${ssrInterpolate(unref(debugSnapshot))}</pre><p class="text-gray-500">Jalankan tombol di bawah untuk mencoba proses masuk secara manual.</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button type="button" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"> Coba lagi </button>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "text-sm text-blue-600 hover:underline block"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Kembali ke beranda `);
          } else {
            return [
              createTextVNode(" Kembali ke beranda ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/sign-in.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=sign-in-1vPo0qTY.mjs.map
