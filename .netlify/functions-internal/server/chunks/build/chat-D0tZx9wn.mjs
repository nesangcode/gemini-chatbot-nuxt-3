import { withAsyncContext, computed, ref, watch, nextTick, mergeProps, unref, isRef, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderList, ssrRenderAttr, ssrRenderStyle, ssrRenderClass } from 'vue/server-renderer';
import { MenuIcon, BotIcon, Loader2Icon, SparklesIcon, XIcon, FileTextIcon, ImagePlusIcon, SendIcon, SquareIcon, MessageSquareIcon, PlusIcon, TrashIcon, UserCircle2Icon } from 'lucide-vue-next';
import { Chat } from '@ai-sdk/vue';
import { TextStreamChatTransport } from 'ai';
import { _ as _sfc_main$4 } from './ModelSelector-C3IuM3HR.mjs';
import { u as useLogtoSession } from './use-logto-session-DLwvinf7.mjs';
import { _ as _export_sfc, a as useNuxtApp } from './server.mjs';
import { u as useFetch } from './fetch-BRos8M9n.mjs';
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
import './cookie-B5htYsqW.mjs';
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
import '@vue/shared';
import './asyncData-D-TePe6k.mjs';

const _sfc_main$3 = {
  __name: "ChatSidebar",
  __ssrInlineRender: true,
  props: {
    sessions: { type: Array, required: true },
    currentSessionId: { type: String, default: null },
    loadingSessionId: { type: String, default: null },
    loading: { type: Boolean, default: false },
    error: { type: Object, default: null },
    pagination: { type: Object, required: true },
    user: { type: Object, default: null },
    isOpen: { type: Boolean, default: false }
  },
  emits: ["create-chat", "select-session", "delete-session", "load-more", "clear-error", "close"],
  setup(__props) {
    useLogtoSession();
    function formatDate(dateString) {
      const date = new Date(dateString);
      const now = /* @__PURE__ */ new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 6e4);
      const diffHours = Math.floor(diffMs / 36e5);
      const diffDays = Math.floor(diffMs / 864e5);
      if (diffMins < 1) return "Baru saja";
      if (diffMins < 60) return `${diffMins} menit yang lalu`;
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      if (diffDays < 7) return `${diffDays} hari yang lalu`;
      return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: [
          "fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col shadow-xl transition-transform duration-300 ease-in-out",
          __props.isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        ]
      }, _attrs))} data-v-c812336b><div class="p-4 border-b border-gray-200/50" data-v-c812336b><div class="flex items-center justify-between mb-4" data-v-c812336b><div class="flex items-center gap-2 flex-1 min-w-0" data-v-c812336b><div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0" data-v-c812336b>`);
      _push(ssrRenderComponent(unref(MessageSquareIcon), { class: "w-5 h-5 text-white" }, null, _parent));
      _push(`</div><div class="flex-1 min-w-0" data-v-c812336b><h1 class="text-lg font-bold text-gray-900 truncate" data-v-c812336b>AI Pastilulus</h1>`);
      if ((_a = __props.user) == null ? void 0 : _a.name) {
        _push(`<p class="text-xs text-gray-700 font-medium truncate" data-v-c812336b>${ssrInterpolate(__props.user.name)}</p>`);
      } else {
        _push(`<!---->`);
      }
      if ((_b = __props.user) == null ? void 0 : _b.email) {
        _push(`<p class="text-xs text-gray-500 truncate" data-v-c812336b>${ssrInterpolate(__props.user.email)}</p>`);
      } else {
        _push(`<!---->`);
      }
      if ((_c = __props.user) == null ? void 0 : _c.phone) {
        _push(`<p class="text-xs text-gray-500 truncate" data-v-c812336b>${ssrInterpolate(__props.user.phone)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="flex items-center gap-2" data-v-c812336b><button class="lg:hidden text-gray-500 hover:text-gray-700 transition-colors p-1" title="Close" data-v-c812336b>`);
      _push(ssrRenderComponent(unref(XIcon), { class: "w-5 h-5" }, null, _parent));
      _push(`</button><button class="text-gray-500 hover:text-gray-700 transition-colors" title="Sign Out" data-v-c812336b><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-c812336b><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" data-v-c812336b></path></svg></button></div></div><button class="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl" data-v-c812336b>`);
      _push(ssrRenderComponent(unref(PlusIcon), { class: "w-5 h-5" }, null, _parent));
      _push(` Chat Baru </button></div>`);
      if (__props.error) {
        _push(`<div class="mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 animate-fade-in" data-v-c812336b><div class="flex items-start gap-2" data-v-c812336b><svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" data-v-c812336b><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" data-v-c812336b></path></svg><div class="flex-1" data-v-c812336b><p class="text-sm text-red-800" data-v-c812336b>${ssrInterpolate(__props.error.message)}</p></div><button class="text-red-400 hover:text-red-600" data-v-c812336b><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" data-v-c812336b><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" data-v-c812336b></path></svg></button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar" data-v-c812336b>`);
      if (__props.sessions.length === 0 && !__props.loading) {
        _push(`<div class="text-center py-8 text-gray-500" data-v-c812336b>`);
        _push(ssrRenderComponent(unref(MessageSquareIcon), { class: "w-12 h-12 mx-auto mb-2 opacity-50" }, null, _parent));
        _push(`<p class="text-sm" data-v-c812336b>Belum ada chat</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(__props.sessions, (session) => {
        _push(`<div class="${ssrRenderClass([
          "relative p-3 rounded-xl transition-all duration-200 group",
          __props.currentSessionId === session.id ? "bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 shadow-md" : "bg-white/50 hover:bg-white border border-gray-200 hover:shadow-md"
        ])}" data-v-c812336b><button class="w-full text-left pr-8" data-v-c812336b><div class="flex items-start gap-2" data-v-c812336b><div class="flex-1 min-w-0" data-v-c812336b><p class="${ssrRenderClass([
          "font-medium truncate",
          __props.currentSessionId === session.id ? "text-indigo-900" : "text-gray-900"
        ])}" data-v-c812336b>${ssrInterpolate(session.title)}</p><p class="text-xs text-gray-500 mt-1" data-v-c812336b>${ssrInterpolate(formatDate(session.updatedAt))}</p></div>`);
        if (__props.loadingSessionId === session.id) {
          _push(ssrRenderComponent(unref(Loader2Icon), { class: "w-5 h-5 text-indigo-600 animate-spin flex-shrink-0" }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div></button>`);
        if (__props.currentSessionId !== session.id) {
          _push(`<button class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 rounded-lg z-10" title="Hapus chat" data-v-c812336b>`);
          _push(ssrRenderComponent(unref(TrashIcon), { class: "w-4 h-4 text-red-500" }, null, _parent));
          _push(`</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      });
      _push(`<!--]-->`);
      if (__props.pagination.hasMore) {
        _push(`<div class="pt-2" data-v-c812336b><button${ssrIncludeBooleanAttr(__props.pagination.loading) ? " disabled" : ""} class="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" data-v-c812336b>`);
        if (__props.pagination.loading) {
          _push(ssrRenderComponent(unref(Loader2Icon), { class: "w-4 h-4 animate-spin" }, null, _parent));
        } else {
          _push(`<span data-v-c812336b>Muat Lebih Banyak</span>`);
        }
        _push(`</button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chat/ChatSidebar.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const ChatSidebar = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-c812336b"]]);
const _sfc_main$2 = {
  __name: "ChatMessage",
  __ssrInlineRender: true,
  props: {
    message: { type: Object, required: true }
  },
  setup(__props) {
    const props = __props;
    const images = computed(() => {
      if (props.message.parts && Array.isArray(props.message.parts)) {
        return props.message.parts.filter((part) => part.type === "image").map((part) => part.image).filter((img) => img);
      }
      if (Array.isArray(props.message.content)) {
        return props.message.content.filter((part) => part.type === "image").map((part) => part.image).filter((img) => img);
      }
      if (props.message.experimental_attachments && Array.isArray(props.message.experimental_attachments)) {
        return props.message.experimental_attachments.filter((att) => {
          var _a;
          return (_a = att.contentType) == null ? void 0 : _a.startsWith("image/");
        }).map((att) => att.url).filter((url) => url);
      }
      return [];
    });
    const pdfs = computed(() => {
      if (props.message.parts && Array.isArray(props.message.parts)) {
        return props.message.parts.filter((part) => part.type === "file").map((part) => ({
          name: part.name || "document.pdf",
          mimeType: part.mimeType || "application/pdf"
        }));
      }
      if (Array.isArray(props.message.content)) {
        return props.message.content.filter((part) => part.type === "file").map((part) => ({
          name: part.name || "document.pdf",
          mimeType: part.mimeType || "application/pdf"
        }));
      }
      if (props.message.experimental_attachments && Array.isArray(props.message.experimental_attachments)) {
        return props.message.experimental_attachments.filter((att) => att.contentType === "application/pdf").map((att) => ({
          name: att.name || "document.pdf",
          mimeType: att.contentType
        }));
      }
      return [];
    });
    const text = computed(() => {
      if (props.message.text) {
        return props.message.text;
      }
      if (props.message.parts && Array.isArray(props.message.parts)) {
        const textPart = props.message.parts.find(
          (part) => part.type === "text" && part.text
        );
        return (textPart == null ? void 0 : textPart.text) || "";
      }
      if (typeof props.message.content === "string") {
        return props.message.content;
      }
      if (Array.isArray(props.message.content)) {
        const textPart = props.message.content.find((part) => part.type === "text");
        return (textPart == null ? void 0 : textPart.text) || "";
      }
      return "";
    });
    const { $renderMarkdown } = useNuxtApp();
    const formattedText = computed(() => {
      if (!text.value) return "";
      return $renderMarkdown(text.value);
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: [
          "flex gap-2 md:gap-3 animate-fade-in",
          __props.message.role === "user" ? "justify-end" : "justify-start"
        ]
      }, _attrs))} data-v-30deb860>`);
      if (__props.message.role === "assistant") {
        _push(`<div class="flex-shrink-0" data-v-30deb860><div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md" data-v-30deb860>`);
        _push(ssrRenderComponent(unref(BotIcon), { class: "w-3.5 h-3.5 md:w-4 md:h-4 text-white" }, null, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="${ssrRenderClass([
        "max-w-[85%] md:max-w-2xl px-3 md:px-5 py-2 md:py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md",
        __props.message.role === "user" ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-tr-sm" : "bg-white border border-gray-200 text-gray-900 rounded-tl-sm"
      ])}" data-v-30deb860>`);
      if (unref(images).length > 0) {
        _push(`<div class="mb-2 md:mb-3 flex flex-wrap gap-2" data-v-30deb860><!--[-->`);
        ssrRenderList(unref(images), (image, idx) => {
          _push(`<img${ssrRenderAttr("src", image)} alt="Uploaded image" class="rounded-lg w-full max-w-[200px] md:max-w-xs max-h-48 md:max-h-64 object-contain border border-gray-200" loading="lazy" data-v-30deb860>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(pdfs).length > 0) {
        _push(`<div class="mb-2 md:mb-3 space-y-2" data-v-30deb860><!--[-->`);
        ssrRenderList(unref(pdfs), (pdf, idx) => {
          _push(`<div class="${ssrRenderClass([
            "flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg",
            __props.message.role === "user" ? "bg-white/20" : "bg-gray-100"
          ])}" data-v-30deb860>`);
          _push(ssrRenderComponent(unref(FileTextIcon), { class: "w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" }, null, _parent));
          _push(`<span class="text-xs md:text-sm truncate" data-v-30deb860>${ssrInterpolate(pdf.name)}</span></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(text)) {
        _push(`<div class="${ssrRenderClass([
          "prose prose-sm max-w-none",
          __props.message.role === "user" ? "prose-invert" : ""
        ])}" data-v-30deb860>${(_a = unref(formattedText)) != null ? _a : ""}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (__props.message.role === "user") {
        _push(`<div class="flex-shrink-0" data-v-30deb860><div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md" data-v-30deb860>`);
        _push(ssrRenderComponent(unref(UserCircle2Icon), { class: "w-3.5 h-3.5 md:w-4 md:h-4 text-white" }, null, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chat/ChatMessage.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const ChatMessage = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-30deb860"]]);
const _sfc_main$1 = {
  __name: "ChatInput",
  __ssrInlineRender: true,
  props: {
    modelValue: { type: String, required: true },
    canSend: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    isBusy: { type: Boolean, default: false },
    selectedImages: { type: Array, default: () => [] },
    selectedPdfs: { type: Array, default: () => [] }
  },
  emits: ["update:modelValue", "send", "stop", "trigger-image-upload", "trigger-pdf-upload", "remove-image", "remove-pdf"],
  setup(__props, { expose: __expose }) {
    const inputRef = ref(null);
    function formatFileSize(bytes) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    }
    __expose({ inputRef });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "border-t border-gray-200/50 bg-white/80 backdrop-blur-xl p-3 md:p-4" }, _attrs))}>`);
      if (__props.selectedImages.length > 0 || __props.selectedPdfs.length > 0) {
        _push(`<div class="mb-2 md:mb-3 flex flex-wrap gap-2"><!--[-->`);
        ssrRenderList(__props.selectedImages, (image, idx) => {
          _push(`<div class="relative group"><img${ssrRenderAttr("src", image.preview)} alt="Preview" class="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border-2 border-indigo-200"><button class="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 text-white rounded-full p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">`);
          _push(ssrRenderComponent(unref(XIcon), { class: "w-3 h-3" }, null, _parent));
          _push(`</button></div>`);
        });
        _push(`<!--]--><!--[-->`);
        ssrRenderList(__props.selectedPdfs, (pdf, idx) => {
          _push(`<div class="relative group bg-gray-100 rounded-lg p-2 pr-8 flex items-center gap-1.5 md:gap-2 border-2 border-indigo-200">`);
          _push(ssrRenderComponent(unref(FileTextIcon), { class: "w-4 h-4 md:w-5 md:h-5 text-gray-600 flex-shrink-0" }, null, _parent));
          _push(`<div class="min-w-0"><p class="text-xs font-medium text-gray-900 truncate max-w-[100px] md:max-w-[150px]">${ssrInterpolate(pdf.name)}</p><p class="text-xs text-gray-500">${ssrInterpolate(formatFileSize(pdf.size))}</p></div><button class="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 text-white rounded-full p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">`);
          _push(ssrRenderComponent(unref(XIcon), { class: "w-3 h-3" }, null, _parent));
          _push(`</button></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex items-end gap-1.5 md:gap-2"><div class="flex gap-0.5 md:gap-1"><button${ssrIncludeBooleanAttr(__props.disabled) ? " disabled" : ""} class="p-2 md:p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Upload gambar">`);
      _push(ssrRenderComponent(unref(ImagePlusIcon), { class: "w-5 h-5" }, null, _parent));
      _push(`</button><button${ssrIncludeBooleanAttr(__props.disabled) ? " disabled" : ""} class="p-2 md:p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Upload PDF">`);
      _push(ssrRenderComponent(unref(FileTextIcon), { class: "w-5 h-5" }, null, _parent));
      _push(`</button></div><div class="flex-1 relative"><textarea${ssrIncludeBooleanAttr(__props.disabled) ? " disabled" : ""} placeholder="Ketik pesan..." rows="1" class="w-full px-3 md:px-4 py-2.5 md:py-3 pr-10 md:pr-12 rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm md:text-base" style="${ssrRenderStyle({ "min-height": "44px", "max-height": "200px" })}">${ssrInterpolate(__props.modelValue)}</textarea></div>`);
      if (!__props.isBusy) {
        _push(`<button${ssrIncludeBooleanAttr(!__props.canSend) ? " disabled" : ""} class="p-2.5 md:p-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg">`);
        _push(ssrRenderComponent(unref(SendIcon), { class: "w-4.5 h-4.5 md:w-5 md:h-5" }, null, _parent));
        _push(`</button>`);
      } else {
        _push(`<button class="p-2.5 md:p-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl">`);
        _push(ssrRenderComponent(unref(SquareIcon), { class: "w-4.5 h-4.5 md:w-5 md:h-5" }, null, _parent));
        _push(`</button>`);
      }
      _push(`</div><p class="text-xs text-gray-500 mt-2 text-center hidden md:block"> Tekan <kbd class="px-2 py-0.5 bg-gray-200 rounded text-xs">Ctrl+Enter</kbd> untuk kirim, <kbd class="px-2 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> untuk baris baru </p></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/chat/ChatInput.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
function useChatSessions() {
  const chatSessions = ref([]);
  const currentSessionId = ref(null);
  const currentSession = ref(null);
  const loadingSessionId = ref(null);
  const sidebarError = ref(null);
  const sessionsPagination = ref({
    limit: 20,
    cursor: null,
    hasMore: false,
    loading: false
  });
  async function fetchChatSessions(refresh = false) {
    try {
      sidebarError.value = null;
      sessionsPagination.value.loading = true;
      const cursor = refresh ? void 0 : sessionsPagination.value.cursor || void 0;
      const response = await $fetch("/api/chat/sessions", {
        params: {
          limit: sessionsPagination.value.limit,
          cursor
        }
      });
      if ((response == null ? void 0 : response.success) && (response == null ? void 0 : response.data)) {
        chatSessions.value = response.data;
        if (currentSessionId.value) {
          const updatedSession = response.data.find((s) => s.id === currentSessionId.value);
          if (updatedSession) {
            currentSession.value = updatedSession;
          }
        }
        if (response.pagination) {
          sessionsPagination.value = {
            ...sessionsPagination.value,
            ...response.pagination,
            loading: false
          };
          if (refresh) {
            sessionsPagination.value.cursor = response.pagination.cursor;
          }
        }
      }
    } catch (error) {
      sidebarError.value = {
        type: "error",
        message: "Gagal memuat daftar chat",
        canRetry: true
      };
      sessionsPagination.value.loading = false;
    }
  }
  async function loadMoreSessions() {
    if (!sessionsPagination.value.hasMore || sessionsPagination.value.loading) {
      return;
    }
    try {
      sessionsPagination.value.loading = true;
      sidebarError.value = null;
      const response = await $fetch("/api/chat/sessions", {
        params: {
          limit: sessionsPagination.value.limit,
          cursor: sessionsPagination.value.cursor || void 0
        }
      });
      if ((response == null ? void 0 : response.success) && (response == null ? void 0 : response.data)) {
        chatSessions.value = [...chatSessions.value, ...response.data];
        if (response.pagination) {
          sessionsPagination.value = {
            ...sessionsPagination.value,
            ...response.pagination,
            loading: false
          };
        }
      }
    } catch (error) {
      sidebarError.value = {
        type: "error",
        message: "Gagal memuat lebih banyak chat",
        canRetry: true
      };
      sessionsPagination.value.loading = false;
    }
  }
  async function createNewChat(model) {
    try {
      sidebarError.value = null;
      const response = await $fetch("/api/chat/sessions", {
        method: "POST",
        body: { model }
      });
      if (response.data) {
        chatSessions.value.unshift(response.data);
        return response.data.id;
      }
    } catch (error) {
      sidebarError.value = {
        type: "error",
        message: "Gagal membuat chat baru",
        canRetry: true
      };
    }
  }
  async function deleteSession(sessionId) {
    try {
      sidebarError.value = null;
      await $fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE"
      });
      chatSessions.value = chatSessions.value.filter((s) => s.id !== sessionId);
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = null;
        currentSession.value = null;
        return true;
      }
      return false;
    } catch (error) {
      sidebarError.value = {
        type: "error",
        message: "Gagal menghapus chat",
        canRetry: true
      };
      throw error;
    }
  }
  async function renameSession(sessionId, newTitle) {
    var _a;
    try {
      const response = await $fetch(`/api/chat/sessions/${sessionId}/rename`, {
        method: "POST",
        body: { title: newTitle }
      });
      if (response.success) {
        const session = chatSessions.value.find((s) => s.id === sessionId);
        if (session) {
          session.title = newTitle;
        }
        if (((_a = currentSession.value) == null ? void 0 : _a.id) === sessionId) {
          currentSession.value.title = newTitle;
        }
      }
    } catch (error) {
      throw error;
    }
  }
  return {
    chatSessions,
    currentSessionId,
    currentSession,
    loadingSessionId,
    sidebarError,
    sessionsPagination,
    fetchChatSessions,
    loadMoreSessions,
    createNewChat,
    deleteSession,
    renameSession
  };
}
function useChatMessages() {
  const messagesError = ref(null);
  const isLoadingOlderMessages = ref(false);
  const messagesPagination = ref({
    total: 0,
    limit: 10,
    offset: 0,
    cursor: null,
    hasMore: false,
    loading: false
  });
  function mapApiMessageToUiMessage(message) {
    const content = message.content;
    if (content && typeof content === "object" && content.type === "multimodal") {
      const parts = [];
      if (content.text) {
        parts.push({ type: "text", text: content.text });
      }
      if (content.images && Array.isArray(content.images)) {
        content.images.forEach((img) => {
          const imageData = img.data ? `data:${img.mimeType || "image/png"};base64,${img.data}` : img.url;
          parts.push({
            type: "image",
            image: imageData,
            mimeType: img.mimeType
          });
        });
      }
      if (content.pdfs && Array.isArray(content.pdfs)) {
        content.pdfs.forEach((pdf) => {
          parts.push({
            type: "file",
            name: pdf.name,
            mimeType: pdf.mimeType
          });
        });
      }
      return {
        id: message.id,
        role: message.role,
        content: parts
      };
    }
    return {
      id: message.id,
      role: message.role,
      content: content || ""
    };
  }
  async function fetchMessages(sessionId) {
    messagesPagination.value = {
      total: 0,
      limit: 10,
      offset: 0,
      cursor: null,
      hasMore: false,
      loading: true
    };
    messagesError.value = null;
    try {
      const response = await $fetch(`/api/chat/sessions/${sessionId}/messages?limit=10`);
      if ((response == null ? void 0 : response.success) && (response == null ? void 0 : response.data)) {
        const mappedMessages = response.data.map(mapApiMessageToUiMessage);
        if (response.pagination) {
          messagesPagination.value = {
            ...messagesPagination.value,
            ...response.pagination,
            loading: false
          };
        }
        return mappedMessages;
      }
      messagesPagination.value.loading = false;
      return [];
    } catch (error) {
      messagesError.value = {
        type: "error",
        message: "Gagal memuat pesan",
        canRetry: true
      };
      messagesPagination.value.loading = false;
      return [];
    }
  }
  async function loadMoreMessages(sessionId) {
    if (!sessionId || !messagesPagination.value.hasMore || messagesPagination.value.loading) {
      return { messages: [], scrollData: null };
    }
    messagesPagination.value.loading = true;
    isLoadingOlderMessages.value = true;
    try {
      const queryParams = new URLSearchParams({
        limit: messagesPagination.value.limit.toString(),
        cursor: messagesPagination.value.cursor || ""
      });
      const response = await $fetch(`/api/chat/sessions/${sessionId}/messages?${queryParams}`);
      if ((response == null ? void 0 : response.success) && (response == null ? void 0 : response.data)) {
        const mappedMessages = response.data.map(mapApiMessageToUiMessage);
        messagesPagination.value = {
          ...messagesPagination.value,
          ...response.pagination,
          loading: false
        };
        return { messages: mappedMessages, scrollData: null };
      }
      messagesPagination.value.loading = false;
      isLoadingOlderMessages.value = false;
      return { messages: [], scrollData: null };
    } catch (error) {
      messagesError.value = {
        type: "error",
        message: "Gagal memuat lebih banyak pesan",
        canRetry: true
      };
      messagesPagination.value.loading = false;
      isLoadingOlderMessages.value = false;
      return { messages: [], scrollData: null };
    }
  }
  function finishLoadingOlderMessages() {
    setTimeout(() => {
      isLoadingOlderMessages.value = false;
    }, 150);
  }
  function clearMessages() {
    messagesPagination.value = {
      total: 0,
      limit: 10,
      offset: 0,
      cursor: null,
      hasMore: false,
      loading: false
    };
    messagesError.value = null;
  }
  return {
    messagesError,
    messagesPagination,
    isLoadingOlderMessages,
    fetchMessages,
    loadMoreMessages,
    finishLoadingOlderMessages,
    clearMessages
  };
}
function useFileUpload() {
  const selectedImages = ref([]);
  const selectedPdfs = ref([]);
  const fileInputRef = ref(null);
  const pdfInputRef = ref(null);
  const isUploadingImages = ref(false);
  const isUploadingPdfs = ref(false);
  function triggerImageUpload() {
    var _a;
    (_a = fileInputRef.value) == null ? void 0 : _a.click();
  }
  function triggerPdfUpload() {
    var _a;
    (_a = pdfInputRef.value) == null ? void 0 : _a.click();
  }
  async function handleImageSelect(event) {
    const input = event.target;
    const files = input.files;
    if (!files || files.length === 0) return;
    isUploadingImages.value = true;
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = (e) => {
            var _a;
            return resolve((_a = e.target) == null ? void 0 : _a.result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const dataUrl = await base64Promise;
        const base64 = dataUrl.split(",")[1];
        selectedImages.value.push({
          data: base64,
          mimeType: file.type,
          name: file.name,
          preview: dataUrl
        });
      }
    } catch (error) {
    } finally {
      isUploadingImages.value = false;
      if (input) input.value = "";
    }
  }
  async function handlePdfSelect(event) {
    const input = event.target;
    const files = input.files;
    if (!files || files.length === 0) return;
    isUploadingPdfs.value = true;
    try {
      for (const file of Array.from(files)) {
        if (file.type !== "application/pdf") continue;
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = (e) => {
            var _a;
            return resolve((_a = e.target) == null ? void 0 : _a.result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const dataUrl = await base64Promise;
        const base64 = dataUrl.split(",")[1];
        selectedPdfs.value.push({
          data: base64,
          mimeType: file.type,
          name: file.name,
          size: file.size
        });
      }
    } catch (error) {
    } finally {
      isUploadingPdfs.value = false;
      if (input) input.value = "";
    }
  }
  function removeImage(index) {
    selectedImages.value.splice(index, 1);
  }
  function removePdf(index) {
    selectedPdfs.value.splice(index, 1);
  }
  function clearAllFiles() {
    selectedImages.value = [];
    selectedPdfs.value = [];
  }
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  }
  return {
    selectedImages,
    selectedPdfs,
    fileInputRef,
    pdfInputRef,
    isUploadingImages,
    isUploadingPdfs,
    triggerImageUpload,
    triggerPdfUpload,
    handleImageSelect,
    handlePdfSelect,
    removeImage,
    removePdf,
    clearAllFiles,
    formatFileSize
  };
}
const _sfc_main = {
  __name: "chat",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    useLogtoSession();
    const { data: authData } = ([__temp, __restore] = withAsyncContext(() => useFetch("/api/auth/me", "$mui2EDGcP-")), __temp = await __temp, __restore(), __temp);
    const user = computed(() => {
      var _a;
      return (_a = authData.value) == null ? void 0 : _a.user;
    });
    const {
      chatSessions,
      currentSessionId,
      currentSession,
      loadingSessionId,
      sidebarError,
      sessionsPagination,
      fetchChatSessions,
      loadMoreSessions,
      createNewChat,
      deleteSession
    } = useChatSessions();
    const {
      messagesError,
      messagesPagination,
      isLoadingOlderMessages,
      fetchMessages,
      clearMessages
    } = useChatMessages();
    const {
      selectedImages,
      selectedPdfs,
      isUploadingImages,
      isUploadingPdfs,
      triggerImageUpload,
      triggerPdfUpload,
      removeImage,
      removePdf,
      clearAllFiles
    } = useFileUpload();
    const messagesEndRef = ref(null);
    ref(null);
    const chatInputRef = ref(null);
    const isSidebarOpen = ref(false);
    const selectedModel = ref("gemini-2.5-flash");
    const input = ref("");
    const chatError = ref(null);
    function handleNetworkError(error, context = "operation") {
      var _a, _b, _c;
      if (!error) {
        return { type: "unknown", message: `Terjadi kesalahan saat ${context}`, canRetry: true };
      }
      if (error.name === "TypeError" || ((_a = error.message) == null ? void 0 : _a.includes("fetch")) || ((_b = error.message) == null ? void 0 : _b.includes("network"))) {
        return { type: "network", message: `Koneksi terputus saat ${context}. Periksa internet Anda.`, canRetry: true };
      }
      if (error.statusCode === 503 || ((_c = error.statusMessage) == null ? void 0 : _c.includes("timeout"))) {
        return { type: "timeout", message: `Server tidak merespons saat ${context}. Coba lagi.`, canRetry: true };
      }
      return { type: "error", message: error.message || `Gagal ${context}`, canRetry: true };
    }
    function handleChatFinish() {
      fetchChatSessions(true).catch(() => {
      });
    }
    const chat2 = new Chat({
      transport: new TextStreamChatTransport({
        api: "/api/chat",
        body: () => ({
          sessionId: currentSessionId.value
        }),
        credentials: "include"
      }),
      onFinish: (options) => {
        if (options.isError) {
          chatError.value = { message: "Terjadi kesalahan saat menerima respons" };
          return;
        }
        if (options.isDisconnect) {
          chatError.value = { message: "Koneksi terputus. Silakan coba lagi." };
          return;
        }
        if (options.isAbort) {
          return;
        }
        handleChatFinish();
      },
      onError: (error) => {
        chatError.value = handleNetworkError(error, "mengirim pesan");
      }
    });
    const isChatBusy = computed(() => chat2.status === "streaming" || chat2.status === "submitted");
    const canSendMessage = computed(
      () => (!!input.value.trim() || selectedImages.value.length > 0 || selectedPdfs.value.length > 0) && !!currentSessionId.value && !isChatBusy.value && !isUploadingImages.value && !isUploadingPdfs.value
    );
    const greeting = computed(() => {
      const hour = (/* @__PURE__ */ new Date()).getHours();
      if (hour >= 0 && hour < 11) return "Selamat pagi";
      if (hour >= 11 && hour < 15) return "Selamat siang";
      if (hour >= 15 && hour < 19) return "Selamat sore";
      return "Selamat malam";
    });
    const displayName = computed(() => {
      var _a, _b;
      if ((_a = user.value) == null ? void 0 : _a.name) {
        return user.value.name;
      }
      const email = ((_b = user.value) == null ? void 0 : _b.email) || "";
      if (email.match(/^user-[a-zA-Z0-9]+@example\.com$/)) {
        return "Pengguna";
      }
      return email;
    });
    watch(() => chat2.messages, () => {
      if (isLoadingOlderMessages.value) return;
      nextTick(() => {
        var _a;
        (_a = messagesEndRef.value) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
      });
    }, { deep: true });
    async function handleCreateChat() {
      const newSessionId = await createNewChat(selectedModel.value);
      if (newSessionId) {
        await handleSelectSession(newSessionId);
      }
    }
    async function handleSelectSession(sessionId) {
      var _a;
      loadingSessionId.value = sessionId;
      currentSessionId.value = sessionId;
      currentSession.value = chatSessions.value.find((s) => s.id === sessionId);
      if ((_a = currentSession.value) == null ? void 0 : _a.model) {
        selectedModel.value = currentSession.value.model;
      }
      try {
        const messages = await fetchMessages(sessionId);
        chat2.messages.splice(0, chat2.messages.length, ...messages);
      } finally {
        loadingSessionId.value = null;
      }
      isSidebarOpen.value = false;
    }
    async function handleDeleteSession(sessionId) {
      if (!confirm("Apakah Anda yakin ingin menghapus chat ini?")) return;
      const shouldClearMessages = await deleteSession(sessionId);
      if (shouldClearMessages) {
        chat2.messages.splice(0, chat2.messages.length);
        clearMessages();
      }
    }
    async function handleModelChange(newModel) {
      if (!currentSessionId.value) {
        selectedModel.value = newModel;
        return;
      }
      try {
        const response = await $fetch(`/api/chat/sessions/${currentSessionId.value}/model`, {
          method: "PATCH",
          body: { model: newModel }
        });
        if (response.success) {
          selectedModel.value = newModel;
          if (currentSession.value) currentSession.value.model = newModel;
          const sessionInList = chatSessions.value.find((s) => s.id === currentSessionId.value);
          if (sessionInList) sessionInList.model = newModel;
        }
      } catch (error) {
        chatError.value = { message: "Gagal mengubah model" };
      }
    }
    async function handleSendMessage() {
      if (!currentSessionId.value) {
        const newSessionId = await createNewChat(selectedModel.value);
        if (!newSessionId) {
          chatError.value = { message: "Gagal membuat chat baru" };
          return;
        }
        await handleSelectSession(newSessionId);
      }
      if (!canSendMessage.value) return;
      const hasImages = selectedImages.value.length > 0;
      const hasPdfs = selectedPdfs.value.length > 0;
      const hasAttachments = hasImages || hasPdfs;
      try {
        chatError.value = null;
        if (hasAttachments) {
          const contentParts = [];
          contentParts.push({
            type: "text",
            text: input.value.trim() || "Silakan analisis gambar/file ini."
          });
          selectedImages.value.forEach((image) => {
            contentParts.push({
              type: "image",
              image: image.preview,
              // Full data URL for immediate display
              mimeType: image.mimeType
            });
          });
          selectedPdfs.value.forEach((pdf, index) => {
            contentParts.push({
              type: "file",
              data: pdf.data,
              mediaType: pdf.mimeType
            });
          });
          await chat2.sendMessage(
            { content: contentParts },
            {
              body: {
                sessionId: currentSessionId.value,
                hasImages,
                images: selectedImages.value,
                hasPdfs,
                pdfs: selectedPdfs.value
              }
            }
          );
        } else {
          const messageContent = [{ type: "text", text: input.value.trim() }];
          await chat2.sendMessage(
            { content: messageContent },
            {
              body: {
                sessionId: currentSessionId.value,
                hasImages: false,
                hasPdfs: false
              }
            }
          );
        }
        input.value = "";
        clearAllFiles();
        nextTick(() => {
          var _a, _b;
          return (_b = (_a = chatInputRef.value) == null ? void 0 : _a.inputRef) == null ? void 0 : _b.focus();
        });
      } catch (error) {
        chatError.value = handleNetworkError(error, "mengirim pesan");
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" }, _attrs))} data-v-4a0db2e7>`);
      if (unref(isSidebarOpen)) {
        _push(`<div class="fixed inset-0 bg-black/50 z-40 lg:hidden" data-v-4a0db2e7></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(ChatSidebar, {
        sessions: unref(chatSessions),
        "current-session-id": unref(currentSessionId),
        "loading-session-id": unref(loadingSessionId),
        error: unref(sidebarError),
        pagination: unref(sessionsPagination),
        user: unref(user),
        "is-open": unref(isSidebarOpen),
        onCreateChat: handleCreateChat,
        onSelectSession: handleSelectSession,
        onDeleteSession: handleDeleteSession,
        onLoadMore: unref(loadMoreSessions),
        onClearError: ($event) => sidebarError.value = null,
        onClose: ($event) => isSidebarOpen.value = false
      }, null, _parent));
      _push(`<div class="flex-1 flex flex-col" data-v-4a0db2e7><div class="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 p-3 md:p-4 shadow-sm" data-v-4a0db2e7><div class="flex items-center justify-between gap-2 md:gap-3" data-v-4a0db2e7><div class="flex items-center gap-2 md:gap-3 flex-1 min-w-0" data-v-4a0db2e7><button class="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" data-v-4a0db2e7>`);
      _push(ssrRenderComponent(unref(MenuIcon), { class: "w-5 h-5" }, null, _parent));
      _push(`</button><div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0" data-v-4a0db2e7>`);
      _push(ssrRenderComponent(unref(BotIcon), { class: "w-4 h-4 md:w-5 md:h-5 text-white" }, null, _parent));
      _push(`</div><div class="flex-1 min-w-0" data-v-4a0db2e7><h2 class="text-sm md:text-lg font-semibold text-gray-900 truncate" data-v-4a0db2e7>${ssrInterpolate(((_a = unref(currentSession)) == null ? void 0 : _a.title) || "Pilih atau buat chat baru")}</h2><p class="text-xs text-gray-500 hidden sm:block" data-v-4a0db2e7>Powered by Google Gemini AI</p></div></div><div class="flex-shrink-0" data-v-4a0db2e7>`);
      _push(ssrRenderComponent(_sfc_main$4, {
        modelValue: unref(selectedModel),
        "onUpdate:modelValue": [($event) => isRef(selectedModel) ? selectedModel.value = $event : null, handleModelChange],
        disabled: unref(isChatBusy)
      }, null, _parent));
      _push(`</div></div></div>`);
      if (!unref(currentSessionId)) {
        _push(`<div class="flex-1 flex flex-col items-center justify-center p-6" data-v-4a0db2e7><div class="w-full max-w-3xl flex flex-col items-center text-center space-y-8" data-v-4a0db2e7><div class="space-y-4" data-v-4a0db2e7><div class="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-2xl mx-auto" data-v-4a0db2e7>`);
        _push(ssrRenderComponent(unref(BotIcon), { class: "w-12 h-12 text-white" }, null, _parent));
        _push(`</div><h1 class="text-3xl md:text-4xl font-bold text-gray-900" data-v-4a0db2e7>${ssrInterpolate(unref(greeting))}, <span class="text-indigo-600" data-v-4a0db2e7>${ssrInterpolate(unref(displayName))}</span></h1><p class="text-lg text-gray-600 max-w-2xl" data-v-4a0db2e7> Mulai percakapan baru dengan Gemini AI atau pilih chat dari sidebar </p></div><div class="w-full" data-v-4a0db2e7>`);
        _push(ssrRenderComponent(_sfc_main$1, {
          ref_key: "chatInputRef",
          ref: chatInputRef,
          modelValue: unref(input),
          "onUpdate:modelValue": ($event) => isRef(input) ? input.value = $event : null,
          "can-send": !!unref(input).trim() || unref(selectedImages).length > 0 || unref(selectedPdfs).length > 0,
          disabled: false,
          "is-busy": unref(isChatBusy),
          "selected-images": unref(selectedImages),
          "selected-pdfs": unref(selectedPdfs),
          onSend: handleSendMessage,
          onStop: ($event) => unref(chat2).stop(),
          onTriggerImageUpload: unref(triggerImageUpload),
          onTriggerPdfUpload: unref(triggerPdfUpload),
          onRemoveImage: unref(removeImage),
          onRemovePdf: unref(removePdf)
        }, null, _parent));
        _push(`<p class="text-sm text-gray-500 mt-3" data-v-4a0db2e7> Ketik pesan dan tekan kirim untuk memulai chat baru </p></div></div></div>`);
      } else {
        _push(`<!--[--><div class="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 custom-scrollbar" data-v-4a0db2e7>`);
        if (unref(messagesPagination).loading && unref(chat2).messages.length === 0) {
          _push(`<div class="flex flex-col items-center justify-center py-20" data-v-4a0db2e7>`);
          _push(ssrRenderComponent(unref(Loader2Icon), { class: "w-12 h-12 text-indigo-600 animate-spin mb-4" }, null, _parent));
          _push(`<p class="text-gray-500 font-medium" data-v-4a0db2e7>Memuat pesan...</p></div>`);
        } else {
          _push(`<!--[-->`);
          if (unref(messagesError)) {
            _push(`<div class="bg-red-50 border border-red-200 rounded-lg p-4" data-v-4a0db2e7><p class="text-red-800" data-v-4a0db2e7>${ssrInterpolate(unref(messagesError).message)}</p></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(chatError)) {
            _push(`<div class="bg-red-50 border border-red-200 rounded-lg p-4" data-v-4a0db2e7><p class="text-red-800" data-v-4a0db2e7>${ssrInterpolate(unref(chatError).message)}</p></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(messagesPagination).hasMore) {
            _push(`<div class="flex justify-center" data-v-4a0db2e7><button${ssrIncludeBooleanAttr(unref(messagesPagination).loading) ? " disabled" : ""} class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50" data-v-4a0db2e7>`);
            if (unref(messagesPagination).loading) {
              _push(ssrRenderComponent(unref(Loader2Icon), { class: "w-4 h-4 animate-spin" }, null, _parent));
            } else {
              _push(`<span data-v-4a0db2e7>Muat Lebih Lama</span>`);
            }
            _push(`</button></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<!--[-->`);
          ssrRenderList(unref(chat2).messages, (message, index) => {
            _push(ssrRenderComponent(ChatMessage, {
              key: message.id || index,
              message
            }, null, _parent));
          });
          _push(`<!--]-->`);
          if (unref(isChatBusy) && unref(chat2).status === "submitted") {
            _push(`<div class="flex gap-3" data-v-4a0db2e7><div class="flex-shrink-0" data-v-4a0db2e7><div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md" data-v-4a0db2e7>`);
            _push(ssrRenderComponent(unref(BotIcon), { class: "w-4 h-4 text-white" }, null, _parent));
            _push(`</div></div><div class="px-5 py-3 rounded-2xl shadow-sm bg-white border border-gray-200 rounded-tl-sm" data-v-4a0db2e7><div class="flex items-center gap-2" data-v-4a0db2e7>`);
            _push(ssrRenderComponent(unref(Loader2Icon), { class: "w-4 h-4 text-indigo-600 animate-spin" }, null, _parent));
            _push(`<span class="text-sm text-gray-600" data-v-4a0db2e7>Sedang berpikir...</span></div></div></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(chat2).messages.length === 0 && unref(currentSessionId)) {
            _push(`<div class="flex flex-col items-center justify-center py-20 text-center" data-v-4a0db2e7><div class="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center mb-4" data-v-4a0db2e7>`);
            _push(ssrRenderComponent(unref(SparklesIcon), { class: "w-10 h-10 text-indigo-600" }, null, _parent));
            _push(`</div><h3 class="text-xl font-semibold text-gray-900 mb-2" data-v-4a0db2e7>Mulai Percakapan</h3><p class="text-gray-500 max-w-md" data-v-4a0db2e7>Tanyakan apa saja kepada Gemini AI. Saya siap membantu Anda!</p></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div data-v-4a0db2e7></div><!--]-->`);
        }
        _push(`</div>`);
        _push(ssrRenderComponent(_sfc_main$1, {
          ref_key: "chatInputRef",
          ref: chatInputRef,
          modelValue: unref(input),
          "onUpdate:modelValue": ($event) => isRef(input) ? input.value = $event : null,
          "can-send": unref(canSendMessage),
          disabled: !unref(currentSessionId),
          "is-busy": unref(isChatBusy),
          "selected-images": unref(selectedImages),
          "selected-pdfs": unref(selectedPdfs),
          onSend: handleSendMessage,
          onStop: ($event) => unref(chat2).stop(),
          onTriggerImageUpload: unref(triggerImageUpload),
          onTriggerPdfUpload: unref(triggerPdfUpload),
          onRemoveImage: unref(removeImage),
          onRemovePdf: unref(removePdf)
        }, null, _parent));
        _push(`<!--]-->`);
      }
      _push(`<input type="file" accept="image/*" multiple class="hidden" data-v-4a0db2e7><input type="file" accept="application/pdf" multiple class="hidden" data-v-4a0db2e7></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/chat.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const chat = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-4a0db2e7"]]);

export { chat as default };
//# sourceMappingURL=chat-D0tZx9wn.mjs.map
