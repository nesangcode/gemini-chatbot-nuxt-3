import { defineComponent, withAsyncContext, computed, watch, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
import { SparklesIcon, MessageSquareIcon, BotIcon, HistoryIcon, LogInIcon, CheckCircleIcon, ArrowRightIcon } from 'lucide-vue-next';
import { u as useFetch } from './fetch-BRos8M9n.mjs';
import { _ as _export_sfc, n as navigateTo } from './server.mjs';
import { a as useLogtoUser, u as useLogtoSession } from './use-logto-session-DLwvinf7.mjs';
import './cookie-B5htYsqW.mjs';
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
import '@vue/shared';
import './asyncData-D-TePe6k.mjs';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    var _a;
    let __temp, __restore;
    const { data: authResponse } = ([__temp, __restore] = withAsyncContext(() => useFetch("/api/auth/me", "$77hSeXQoip")), __temp = await __temp, __restore(), __temp);
    if ((_a = authResponse.value) == null ? void 0 : _a.user) {
      [__temp, __restore] = withAsyncContext(() => navigateTo("/chat", { replace: true })), await __temp, __restore();
    }
    const user = useLogtoUser();
    const isAuthenticated = computed(() => Boolean(user == null ? void 0 : user.value));
    useLogtoSession();
    if (user) {
      watch(user, (newUser) => {
        if (newUser) {
          navigateTo("/chat", { replace: true });
        }
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden" }, _attrs))} data-v-baea6eba><div class="absolute inset-0 overflow-hidden pointer-events-none" data-v-baea6eba><div class="absolute top-20 left-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" data-v-baea6eba></div><div class="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" data-v-baea6eba></div><div class="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" data-v-baea6eba></div></div><div class="max-w-md w-full space-y-8 relative z-10" data-v-baea6eba><div class="text-center" data-v-baea6eba><div class="flex justify-center mb-6" data-v-baea6eba><div class="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/50 animate-float" data-v-baea6eba>`);
      _push(ssrRenderComponent(unref(SparklesIcon), { class: "w-10 h-10 text-white" }, null, _parent));
      _push(`</div></div><h1 class="text-5xl font-bold mb-3" data-v-baea6eba><span class="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent" data-v-baea6eba> Gemini Chatbot </span></h1><p class="text-gray-600 mb-8 text-lg" data-v-baea6eba>Berinteraksi dengan AI menggunakan Google Gemini 2.5 Pro</p><div class="grid grid-cols-1 gap-3 mb-8 text-left" data-v-baea6eba><div class="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-gray-200/50 shadow-sm" data-v-baea6eba><div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0" data-v-baea6eba>`);
      _push(ssrRenderComponent(unref(MessageSquareIcon), { class: "w-5 h-5 text-indigo-600" }, null, _parent));
      _push(`</div><div data-v-baea6eba><p class="font-medium text-gray-900 text-sm" data-v-baea6eba>Chat Interaktif</p><p class="text-xs text-gray-600" data-v-baea6eba>Percakapan real-time dengan AI</p></div></div><div class="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-gray-200/50 shadow-sm" data-v-baea6eba><div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0" data-v-baea6eba>`);
      _push(ssrRenderComponent(unref(BotIcon), { class: "w-5 h-5 text-blue-600" }, null, _parent));
      _push(`</div><div data-v-baea6eba><p class="font-medium text-gray-900 text-sm" data-v-baea6eba>AI Canggih</p><p class="text-xs text-gray-600" data-v-baea6eba>Powered by Gemini 2.5 Pro</p></div></div><div class="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-gray-200/50 shadow-sm" data-v-baea6eba><div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0" data-v-baea6eba>`);
      _push(ssrRenderComponent(unref(HistoryIcon), { class: "w-5 h-5 text-purple-600" }, null, _parent));
      _push(`</div><div data-v-baea6eba><p class="font-medium text-gray-900 text-sm" data-v-baea6eba>Riwayat Tersimpan</p><p class="text-xs text-gray-600" data-v-baea6eba>Akses chat sebelumnya kapan saja</p></div></div></div>`);
      if (!unref(isAuthenticated)) {
        _push(`<div class="space-y-4" data-v-baea6eba><button class="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-[1.02] flex items-center justify-center gap-2" data-v-baea6eba>`);
        _push(ssrRenderComponent(unref(LogInIcon), { class: "w-5 h-5" }, null, _parent));
        _push(` Masuk dengan Logto </button><p class="text-xs text-gray-500" data-v-baea6eba>Aman dan terpercaya dengan autentikasi Logto</p></div>`);
      } else {
        _push(`<div class="space-y-4" data-v-baea6eba><div class="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4" data-v-baea6eba><p class="text-green-700 font-semibold flex items-center justify-center gap-2" data-v-baea6eba>`);
        _push(ssrRenderComponent(unref(CheckCircleIcon), { class: "w-5 h-5" }, null, _parent));
        _push(` Selamat datang kembali! </p></div><button class="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 shadow-xl shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/40 hover:scale-[1.02] flex items-center justify-center gap-2" data-v-baea6eba>`);
        _push(ssrRenderComponent(unref(ArrowRightIcon), { class: "w-5 h-5" }, null, _parent));
        _push(` Mulai Chat </button></div>`);
      }
      _push(`</div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-baea6eba"]]);

export { index as default };
//# sourceMappingURL=index-DN5FVxaF.mjs.map
