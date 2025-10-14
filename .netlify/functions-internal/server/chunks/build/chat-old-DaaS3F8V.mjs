import { ref, withAsyncContext, computed, watch, nextTick, mergeProps, unref, isRef, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrIncludeBooleanAttr, ssrRenderAttr, ssrRenderStyle } from 'vue/server-renderer';
import { SparklesIcon, PlusIcon, Loader2Icon, MessageSquareIcon, TrashIcon, BotIcon, FileTextIcon, UserCircle2Icon, XIcon, ImagePlusIcon, SquareIcon, SendIcon } from 'lucide-vue-next';
import { Chat } from '@ai-sdk/vue';
import { TextStreamChatTransport } from 'ai';
import { _ as _sfc_main$1 } from './ModelSelector-C3IuM3HR.mjs';
import { _ as _export_sfc, a as useNuxtApp } from './server.mjs';
import { u as useLogtoSession } from './use-logto-session-DLwvinf7.mjs';
import { b as useRequestHeaders } from './cookie-B5htYsqW.mjs';
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
  __name: "chat-old",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    useLogtoSession();
    const currentSessionId = ref(null);
    const currentSession = ref(null);
    const loadingSessionId = ref(null);
    const selectedModel = ref("gemini-2.5-flash");
    const sidebarError = ref(null);
    const messagesError = ref(null);
    const chatError = ref(null);
    const sessionsPagination = ref({
      limit: 20,
      cursor: null,
      hasMore: false,
      loading: false
    });
    const chatSessions = ref([]);
    function handleNetworkError(error, context = "operation") {
      var _a, _b, _c;
      console.error(`Error in ${context}:`, error);
      if (!error) {
        return {
          type: "unknown",
          message: `Terjadi kesalahan saat ${context}`,
          canRetry: true
        };
      }
      if (error.name === "TypeError" || ((_a = error.message) == null ? void 0 : _a.includes("fetch")) || ((_b = error.message) == null ? void 0 : _b.includes("network"))) {
        return {
          type: "network",
          message: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
          canRetry: true
        };
      }
      if (error.name === "TimeoutError" || ((_c = error.message) == null ? void 0 : _c.includes("timeout"))) {
        return {
          type: "timeout",
          message: "Koneksi timeout. Server membutuhkan waktu terlalu lama untuk merespons.",
          canRetry: true
        };
      }
      if (error.statusCode >= 500) {
        return {
          type: "server",
          message: "Server sedang mengalami masalah. Silakan coba lagi nanti.",
          canRetry: true
        };
      }
      if (error.statusCode >= 400 && error.statusCode < 500) {
        return {
          type: "client",
          message: error.message || error.statusMessage || "Permintaan tidak valid.",
          canRetry: false
        };
      }
      return {
        type: "unknown",
        message: error.message || error.statusMessage || `Terjadi kesalahan saat ${context}`,
        canRetry: true
      };
    }
    async function fetchChatSessions() {
      var _a, _b;
      try {
        sessionsPagination.value.loading = true;
        sidebarError.value = null;
        const headers = useRequestHeaders(["cookie"]);
        const response = await $fetch("/api/chat/sessions", {
          headers,
          params: {
            limit: sessionsPagination.value.limit
          }
        });
        if ((response == null ? void 0 : response.success) && (response == null ? void 0 : response.data)) {
          chatSessions.value = response.data;
          sessionsPagination.value = {
            ...sessionsPagination.value,
            cursor: ((_a = response.pagination) == null ? void 0 : _a.cursor) || null,
            hasMore: ((_b = response.pagination) == null ? void 0 : _b.hasMore) || false,
            loading: false
          };
        }
      } catch (error) {
        sidebarError.value = handleNetworkError(error, "mengambil daftar chat");
        sessionsPagination.value.loading = false;
      }
    }
    [__temp, __restore] = withAsyncContext(() => fetchChatSessions()), await __temp, __restore();
    console.log("[Chat] Page initialized, setting up chat composable");
    const messagesEndRef = ref(null);
    ref(null);
    ref(null);
    const finishHandlerExecuting = ref(false);
    const isLoadingOlderMessages = ref(false);
    async function handleChatFinish() {
      if (finishHandlerExecuting.value) {
        return;
      }
      finishHandlerExecuting.value = true;
      try {
        if (currentSessionId.value) {
          if (chat.messages.length === 2) {
            setTimeout(async () => {
              await fetchChatSessions();
              if (currentSessionId.value) {
                currentSession.value = chatSessions.value.find((s) => s.id === currentSessionId.value);
              }
            }, 3e3);
          } else {
            await fetchChatSessions();
            if (currentSessionId.value) {
              currentSession.value = chatSessions.value.find((s) => s.id === currentSessionId.value);
            }
          }
        }
      } catch (error) {
      } finally {
        setTimeout(() => {
          finishHandlerExecuting.value = false;
        }, 1e3);
      }
    }
    const chat = new Chat({
      transport: new TextStreamChatTransport({
        api: "/api/chat",
        body: () => ({
          sessionId: currentSessionId.value
        }),
        credentials: "include"
      }),
      onFinish: (options) => {
        if (options.isError) {
          console.error("[Chat] Stream finished with error");
          chatError.value = "Terjadi kesalahan saat menerima respons";
        } else if (options.isDisconnect) {
          console.error("[Chat] Stream disconnected");
          chatError.value = "Koneksi terputus. Silakan coba lagi.";
        } else if (options.isAbort) {
          console.log("[Chat] Stream aborted by user");
        }
        handleChatFinish();
      },
      onError: (error) => {
        console.error("[Chat] onError:", error);
        chatError.value = handleNetworkError(error, "mengirim pesan");
      }
    });
    const isChatBusy = computed(() => chat.status === "streaming" || chat.status === "submitted");
    const input = ref("");
    const selectedImages = ref([]);
    const selectedPdfs = ref([]);
    ref(null);
    ref(null);
    const isUploadingImages = ref(false);
    const isUploadingPdfs = ref(false);
    const canSendMessage = computed(() => (!!input.value.trim() || selectedImages.value.length > 0 || selectedPdfs.value.length > 0) && !!currentSessionId.value && !isChatBusy.value && !isUploadingImages.value && !isUploadingPdfs.value);
    const messagesPagination = ref({
      total: 0,
      limit: 10,
      offset: 0,
      cursor: null,
      hasMore: false,
      loading: false
    });
    watch(() => chat.messages, (newMessages, oldMessages) => {
      if (isLoadingOlderMessages.value) {
        return;
      }
      nextTick(() => {
        var _a;
        (_a = messagesEndRef.value) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
      });
    }, { deep: true });
    function formatDate(dateString) {
      const date = new Date(dateString);
      const now = /* @__PURE__ */ new Date();
      const diffInHours = (now - date) / (1e3 * 60 * 60);
      if (diffInHours < 24) {
        return date.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });
      } else {
        return date.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short"
        });
      }
    }
    const { $renderMarkdown } = useNuxtApp();
    function formatMessage(content) {
      return $renderMarkdown(content || "");
    }
    function getMessageText(message) {
      var _a;
      if (!message) {
        return "";
      }
      if (typeof message.content === "object" && ((_a = message.content) == null ? void 0 : _a.type) === "multimodal") {
        return message.content.text || "";
      }
      if (typeof message.content === "string") {
        return message.content;
      }
      if (Array.isArray(message.content)) {
        return message.content.map((part) => {
          if (typeof part === "string") {
            return part;
          }
          if (typeof (part == null ? void 0 : part.text) === "string") {
            return part.text;
          }
          return "";
        }).join("");
      }
      if (Array.isArray(message.parts)) {
        return message.parts.map((part) => {
          if (typeof part === "string") {
            return part;
          }
          if (typeof (part == null ? void 0 : part.text) === "string") {
            return part.text;
          }
          return "";
        }).join("");
      }
      if (typeof message.text === "string") {
        return message.text;
      }
      return "";
    }
    function getMessageImages(message) {
      var _a;
      if (!message) {
        return [];
      }
      if (typeof message.content === "object" && ((_a = message.content) == null ? void 0 : _a.type) === "multimodal") {
        return message.content.images || [];
      }
      return [];
    }
    function getMessagePdfs(message) {
      var _a;
      if (!message) {
        return [];
      }
      if (typeof message.content === "object" && ((_a = message.content) == null ? void 0 : _a.type) === "multimodal") {
        return message.content.pdfs || [];
      }
      if (Array.isArray(message.content)) {
        const pdfParts = message.content.filter(
          (part) => part.type === "file" && part.mimeType === "application/pdf"
        );
        return pdfParts.map((part) => ({
          data: part.data,
          mimeType: part.mimeType,
          name: part.name || "document.pdf",
          size: part.size || 0
        }));
      }
      return [];
    }
    function formatFileSize(bytes) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
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
          if (currentSession.value) {
            currentSession.value.model = newModel;
          }
          const sessionInList = chatSessions.value.find((s) => s.id === currentSessionId.value);
          if (sessionInList) {
            sessionInList.model = newModel;
          }
        }
      } catch (error) {
        console.error("Error updating model:", error);
        chatError.value = handleNetworkError(error, "mengubah model");
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" }, _attrs))} data-v-39c0e2c5><div class="w-80 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col shadow-xl" data-v-39c0e2c5><div class="p-4 border-b border-gray-200/50" data-v-39c0e2c5><div class="flex items-center justify-between mb-4" data-v-39c0e2c5><div class="flex items-center gap-2" data-v-39c0e2c5>`);
      _push(ssrRenderComponent(unref(SparklesIcon), { class: "w-6 h-6 text-indigo-600" }, null, _parent));
      _push(`<h1 class="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent" data-v-39c0e2c5>Gemini Chat</h1></div><button class="text-gray-500 hover:text-red-600 text-sm font-medium transition-colors" data-v-39c0e2c5> Keluar </button></div><button class="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02]" data-v-39c0e2c5>`);
      _push(ssrRenderComponent(unref(PlusIcon), { class: "w-5 h-5" }, null, _parent));
      _push(` Chat Baru </button></div>`);
      if (unref(sidebarError)) {
        _push(`<div class="mx-3 mt-3 bg-red-50 border border-red-200 rounded-lg p-3 animate-fade-in" data-v-39c0e2c5><div class="flex items-start gap-2" data-v-39c0e2c5><svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" data-v-39c0e2c5><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" data-v-39c0e2c5></path></svg><div class="flex-1 min-w-0" data-v-39c0e2c5><p class="text-sm font-medium text-red-800" data-v-39c0e2c5>${ssrInterpolate(unref(sidebarError).message)}</p>`);
        if (unref(sidebarError).canRetry) {
          _push(`<button class="mt-2 text-xs font-medium text-red-700 hover:text-red-800 underline" data-v-39c0e2c5> Coba Lagi </button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><button class="flex-shrink-0 text-red-400 hover:text-red-600" data-v-39c0e2c5><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" data-v-39c0e2c5><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" data-v-39c0e2c5></path></svg></button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar" data-v-39c0e2c5><!--[-->`);
      ssrRenderList(unref(chatSessions), (session) => {
        _push(`<div class="${ssrRenderClass([
          "group relative p-3 rounded-xl cursor-pointer transition-all duration-200",
          unref(currentSessionId) === session.id ? "bg-gradient-to-r from-indigo-100 to-blue-100 border border-indigo-200 shadow-md" : "hover:bg-gray-100/70 hover:shadow-sm"
        ])}" data-v-39c0e2c5><div class="flex items-start gap-2 pr-8" data-v-39c0e2c5>`);
        if (unref(loadingSessionId) === session.id) {
          _push(ssrRenderComponent(unref(Loader2Icon), { class: "w-4 h-4 mt-1 flex-shrink-0 text-indigo-600 animate-spin" }, null, _parent));
        } else {
          _push(ssrRenderComponent(unref(MessageSquareIcon), {
            class: ["w-4 h-4 mt-1 flex-shrink-0", unref(currentSessionId) === session.id ? "text-indigo-600" : "text-gray-400"]
          }, null, _parent));
        }
        _push(`<div class="flex-1 min-w-0" data-v-39c0e2c5><h3 class="font-medium text-gray-900 truncate text-sm" data-v-39c0e2c5>${ssrInterpolate(session.title)}</h3><p class="text-xs text-gray-500 mt-0.5" data-v-39c0e2c5>${ssrInterpolate(formatDate(session.updatedAt))}</p></div></div><button class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 rounded-lg z-10" title="Hapus chat" data-v-39c0e2c5>`);
        _push(ssrRenderComponent(unref(TrashIcon), { class: "w-3.5 h-3.5 text-red-600" }, null, _parent));
        _push(`</button></div>`);
      });
      _push(`<!--]-->`);
      if (unref(chatSessions).length === 0 && !unref(sessionsPagination).loading) {
        _push(`<div class="text-center text-gray-500 py-12" data-v-39c0e2c5>`);
        _push(ssrRenderComponent(unref(MessageSquareIcon), { class: "w-12 h-12 mx-auto mb-3 text-gray-300" }, null, _parent));
        _push(`<p class="text-sm" data-v-39c0e2c5>Belum ada riwayat chat</p></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(sessionsPagination).hasMore) {
        _push(`<div class="px-3 pb-3" data-v-39c0e2c5><button${ssrIncludeBooleanAttr(unref(sessionsPagination).loading) ? " disabled" : ""} class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" data-v-39c0e2c5>`);
        if (unref(sessionsPagination).loading) {
          _push(ssrRenderComponent(unref(Loader2Icon), { class: "w-4 h-4 animate-spin" }, null, _parent));
        } else {
          _push(`<span data-v-39c0e2c5>Muat Lebih Banyak</span>`);
        }
        _push(`</button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="flex-1 flex flex-col" data-v-39c0e2c5><div class="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 p-4 shadow-sm" data-v-39c0e2c5><div class="flex items-center justify-between gap-3" data-v-39c0e2c5><div class="flex items-center gap-3 flex-1 min-w-0" data-v-39c0e2c5><div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0" data-v-39c0e2c5>`);
      _push(ssrRenderComponent(unref(BotIcon), { class: "w-5 h-5 text-white" }, null, _parent));
      _push(`</div><div class="flex-1 min-w-0" data-v-39c0e2c5><h2 class="text-lg font-semibold text-gray-900 truncate" data-v-39c0e2c5>${ssrInterpolate(((_a = unref(currentSession)) == null ? void 0 : _a.title) || "Pilih atau buat chat baru")}</h2><p class="text-xs text-gray-500" data-v-39c0e2c5>Powered by Google Gemini AI</p></div></div><div class="flex-shrink-0" data-v-39c0e2c5>`);
      _push(ssrRenderComponent(_sfc_main$1, {
        modelValue: unref(selectedModel),
        "onUpdate:modelValue": [($event) => isRef(selectedModel) ? selectedModel.value = $event : null, handleModelChange],
        disabled: unref(isChatBusy)
      }, null, _parent));
      _push(`</div></div></div><div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" data-v-39c0e2c5>`);
      if (unref(messagesPagination).loading && unref(chat).messages.length === 0) {
        _push(`<div class="flex flex-col items-center justify-center py-20" data-v-39c0e2c5>`);
        _push(ssrRenderComponent(unref(Loader2Icon), { class: "w-12 h-12 text-indigo-600 animate-spin mb-4" }, null, _parent));
        _push(`<p class="text-gray-500 font-medium" data-v-39c0e2c5>Memuat pesan...</p></div>`);
      } else {
        _push(`<!--[-->`);
        if (unref(messagesError)) {
          _push(`<div class="bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in" data-v-39c0e2c5><div class="flex items-start gap-3" data-v-39c0e2c5><svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" data-v-39c0e2c5><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" data-v-39c0e2c5></path></svg><div class="flex-1" data-v-39c0e2c5><p class="font-semibold text-red-800" data-v-39c0e2c5>Kesalahan Jaringan</p><p class="text-sm text-red-700 mt-1" data-v-39c0e2c5>${ssrInterpolate(unref(messagesError).message)}</p>`);
          if (unref(messagesError).canRetry && unref(currentSessionId)) {
            _push(`<button class="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors" data-v-39c0e2c5> Coba Lagi </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><button class="flex-shrink-0 text-red-400 hover:text-red-600" data-v-39c0e2c5><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" data-v-39c0e2c5><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" data-v-39c0e2c5></path></svg></button></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(chatError)) {
          _push(`<div class="bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in" data-v-39c0e2c5><div class="flex items-start gap-3" data-v-39c0e2c5><svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" data-v-39c0e2c5><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" data-v-39c0e2c5></path></svg><div class="flex-1" data-v-39c0e2c5><p class="font-semibold text-red-800" data-v-39c0e2c5>Gagal Mengirim Pesan</p><p class="text-sm text-red-700 mt-1" data-v-39c0e2c5>${ssrInterpolate(unref(chatError).message)}</p>`);
          if (unref(chatError).canRetry) {
            _push(`<p class="text-xs text-red-600 mt-2" data-v-39c0e2c5>Pesan Anda tidak terkirim. Silakan coba kirim ulang.</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><button class="flex-shrink-0 text-red-400 hover:text-red-600" data-v-39c0e2c5><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" data-v-39c0e2c5><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" data-v-39c0e2c5></path></svg></button></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(chat).error) {
          _push(`<div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md relative animate-fade-in" data-v-39c0e2c5><div class="flex" data-v-39c0e2c5><div class="py-1" data-v-39c0e2c5><svg class="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" data-v-39c0e2c5><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2h-2a1 1 0 0 1-1-1zm-1-4a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1z" data-v-39c0e2c5></path></svg></div><div data-v-39c0e2c5><p class="font-bold" data-v-39c0e2c5>Terjadi Kesalahan</p><p class="text-sm" data-v-39c0e2c5>${ssrInterpolate(unref(chat).error.message)}</p></div></div><button class="absolute top-2 right-2 text-red-500 hover:text-red-700" data-v-39c0e2c5><svg class="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" data-v-39c0e2c5><title data-v-39c0e2c5>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" data-v-39c0e2c5></path></svg></button></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(messagesPagination).hasMore) {
          _push(`<div class="flex justify-center" data-v-39c0e2c5><button${ssrIncludeBooleanAttr(unref(messagesPagination).loading) ? " disabled" : ""} class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed" data-v-39c0e2c5>`);
          if (unref(messagesPagination).loading) {
            _push(ssrRenderComponent(unref(Loader2Icon), { class: "w-4 h-4 animate-spin" }, null, _parent));
          } else {
            _push(`<span data-v-39c0e2c5>Muat Lebih Lama</span>`);
          }
          _push(`</button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(unref(chat).messages, (message, index) => {
          var _a2;
          _push(`<div class="${ssrRenderClass([
            "flex gap-3 animate-fade-in",
            message.role === "user" ? "justify-end" : "justify-start"
          ])}" data-v-39c0e2c5>`);
          if (message.role === "assistant") {
            _push(`<div class="flex-shrink-0" data-v-39c0e2c5><div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md" data-v-39c0e2c5>`);
            _push(ssrRenderComponent(unref(BotIcon), { class: "w-4 h-4 text-white" }, null, _parent));
            _push(`</div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="${ssrRenderClass([
            "max-w-2xl px-5 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md",
            message.role === "user" ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-tr-sm" : "bg-white border border-gray-200 text-gray-900 rounded-tl-sm"
          ])}" data-v-39c0e2c5>`);
          if (getMessageImages(message).length > 0) {
            _push(`<div class="mb-3 flex flex-wrap gap-2" data-v-39c0e2c5><!--[-->`);
            ssrRenderList(getMessageImages(message), (image, idx) => {
              _push(`<img${ssrRenderAttr("src", `data:${image.mimeType || "image/jpeg"};base64,${image.data}`)} class="${ssrRenderClass([message.role === "user" ? "border-2 border-white/30" : "border border-gray-200", "max-w-xs max-h-48 rounded-lg object-cover"])}" data-v-39c0e2c5>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          if (getMessagePdfs(message).length > 0) {
            _push(`<div class="mb-3 flex flex-wrap gap-2" data-v-39c0e2c5><!--[-->`);
            ssrRenderList(getMessagePdfs(message), (pdf, idx) => {
              _push(`<div class="${ssrRenderClass([
                "px-3 py-2 rounded-lg flex items-center gap-2",
                message.role === "user" ? "bg-white/20 border border-white/30" : "bg-blue-50 border border-blue-200"
              ])}" data-v-39c0e2c5>`);
              _push(ssrRenderComponent(unref(FileTextIcon), {
                class: ["w-4 h-4 flex-shrink-0", message.role === "user" ? "text-white" : "text-blue-600"]
              }, null, _parent));
              _push(`<span class="${ssrRenderClass([message.role === "user" ? "text-white" : "text-blue-800", "text-sm font-medium truncate max-w-xs"])}" data-v-39c0e2c5>${ssrInterpolate(pdf.name)}</span></div>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          if (getMessageText(message)) {
            _push(`<div class="${ssrRenderClass([message.role === "user" ? "prose-invert" : "", "prose prose-sm max-w-none leading-snug"])}" data-v-39c0e2c5>${(_a2 = formatMessage(getMessageText(message))) != null ? _a2 : ""}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (message.role === "user") {
            _push(`<div class="flex-shrink-0" data-v-39c0e2c5><div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md" data-v-39c0e2c5>`);
            _push(ssrRenderComponent(unref(UserCircle2Icon), { class: "w-4 h-4 text-white" }, null, _parent));
            _push(`</div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]-->`);
        if (unref(isChatBusy) && unref(chat).status === "submitted") {
          _push(`<div class="flex gap-3 animate-fade-in" data-v-39c0e2c5><div class="flex-shrink-0" data-v-39c0e2c5><div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md" data-v-39c0e2c5>`);
          _push(ssrRenderComponent(unref(BotIcon), { class: "w-4 h-4 text-white" }, null, _parent));
          _push(`</div></div><div class="max-w-2xl px-5 py-3 rounded-2xl shadow-sm bg-white border border-gray-200 text-gray-900 rounded-tl-sm" data-v-39c0e2c5><div class="flex items-center gap-2" data-v-39c0e2c5>`);
          _push(ssrRenderComponent(unref(Loader2Icon), { class: "w-4 h-4 text-indigo-600 animate-spin" }, null, _parent));
          _push(`<span class="text-sm text-gray-600" data-v-39c0e2c5>Sedang berpikir...</span></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(chat).messages.length === 0 && unref(currentSessionId)) {
          _push(`<div class="flex flex-col items-center justify-center py-20 text-center" data-v-39c0e2c5><div class="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center mb-4" data-v-39c0e2c5>`);
          _push(ssrRenderComponent(unref(SparklesIcon), { class: "w-10 h-10 text-indigo-600" }, null, _parent));
          _push(`</div><h3 class="text-xl font-semibold text-gray-900 mb-2" data-v-39c0e2c5>Mulai Percakapan</h3><p class="text-gray-500 max-w-md" data-v-39c0e2c5>Tanyakan apa saja kepada Gemini AI. Saya siap membantu Anda!</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div data-v-39c0e2c5></div><!--]-->`);
      }
      _push(`</div><div class="bg-white/80 backdrop-blur-xl border-t border-gray-200/50 p-4 shadow-lg" data-v-39c0e2c5><div class="max-w-4xl mx-auto" data-v-39c0e2c5>`);
      if (unref(selectedImages).length > 0 || unref(isUploadingImages) || unref(selectedPdfs).length > 0 || unref(isUploadingPdfs)) {
        _push(`<div class="mb-3 flex flex-wrap gap-2" data-v-39c0e2c5><!--[-->`);
        ssrRenderList(unref(selectedImages), (image, index) => {
          _push(`<div class="relative group" data-v-39c0e2c5><img${ssrRenderAttr("src", image.preview)} class="w-20 h-20 object-cover rounded-lg border-2 border-indigo-200" data-v-39c0e2c5><button class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" data-v-39c0e2c5>`);
          _push(ssrRenderComponent(unref(XIcon), { class: "w-3 h-3" }, null, _parent));
          _push(`</button></div>`);
        });
        _push(`<!--]-->`);
        if (unref(isUploadingImages)) {
          _push(`<div class="w-20 h-20 rounded-lg border-2 border-indigo-200 bg-indigo-50 flex items-center justify-center" data-v-39c0e2c5>`);
          _push(ssrRenderComponent(unref(Loader2Icon), { class: "w-6 h-6 text-indigo-600 animate-spin" }, null, _parent));
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(unref(selectedPdfs), (pdf, index) => {
          _push(`<div class="relative group" data-v-39c0e2c5><div class="w-32 h-20 rounded-lg border-2 border-blue-200 bg-blue-50 p-2 flex flex-col items-center justify-center" data-v-39c0e2c5>`);
          _push(ssrRenderComponent(unref(FileTextIcon), { class: "w-6 h-6 text-blue-600 mb-1" }, null, _parent));
          _push(`<p class="text-xs text-blue-800 font-medium truncate w-full text-center px-1" data-v-39c0e2c5>${ssrInterpolate(pdf.name)}</p><p class="text-xs text-blue-600" data-v-39c0e2c5>${ssrInterpolate(formatFileSize(pdf.size))}</p></div><button class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" data-v-39c0e2c5>`);
          _push(ssrRenderComponent(unref(XIcon), { class: "w-3 h-3" }, null, _parent));
          _push(`</button></div>`);
        });
        _push(`<!--]-->`);
        if (unref(isUploadingPdfs)) {
          _push(`<div class="w-32 h-20 rounded-lg border-2 border-blue-200 bg-blue-50 flex items-center justify-center" data-v-39c0e2c5>`);
          _push(ssrRenderComponent(unref(Loader2Icon), { class: "w-6 h-6 text-blue-600 animate-spin" }, null, _parent));
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex gap-3 items-end" data-v-39c0e2c5><input type="file" accept="image/*" multiple class="hidden" data-v-39c0e2c5><input type="file" accept="application/pdf,.pdf" multiple class="hidden" data-v-39c0e2c5><button type="button"${ssrIncludeBooleanAttr(unref(isChatBusy) || !unref(currentSessionId) || unref(isUploadingImages) || unref(isUploadingPdfs)) ? " disabled" : ""} class="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"${ssrRenderAttr("title", unref(isUploadingImages) ? "Mengunggah gambar..." : "Upload gambar")} data-v-39c0e2c5>`);
      if (unref(isUploadingImages)) {
        _push(ssrRenderComponent(unref(Loader2Icon), { class: "w-5 h-5 animate-spin" }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(ImagePlusIcon), { class: "w-5 h-5" }, null, _parent));
      }
      _push(`</button><button type="button"${ssrIncludeBooleanAttr(unref(isChatBusy) || !unref(currentSessionId) || unref(isUploadingImages) || unref(isUploadingPdfs)) ? " disabled" : ""} class="flex-shrink-0 bg-blue-100 hover:bg-blue-200 text-blue-700 p-3 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"${ssrRenderAttr("title", unref(isUploadingPdfs) ? "Mengunggah PDF..." : "Upload PDF")} data-v-39c0e2c5>`);
      if (unref(isUploadingPdfs)) {
        _push(ssrRenderComponent(unref(Loader2Icon), { class: "w-5 h-5 animate-spin" }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(FileTextIcon), { class: "w-5 h-5" }, null, _parent));
      }
      _push(`</button><div class="flex-1 relative" data-v-39c0e2c5><form data-v-39c0e2c5><textarea${ssrIncludeBooleanAttr(unref(isChatBusy) || !unref(currentSessionId) || unref(isUploadingImages) || unref(isUploadingPdfs)) ? " disabled" : ""}${ssrRenderAttr("placeholder", unref(isUploadingImages) ? "Mengunggah gambar..." : unref(isUploadingPdfs) ? "Mengunggah PDF..." : "Ketik pesan Anda... (Enter untuk kirim)")} rows="1" class="${ssrRenderClass([
        "w-full px-5 py-3 pr-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 resize-none transition-all duration-200 shadow-sm hover:shadow-md",
        {
          "text-gray-400 placeholder:text-gray-400": unref(isChatBusy) || !unref(currentSessionId)
        }
      ])}" style="${ssrRenderStyle({ "max-height": "150px", "min-height": "48px" })}" data-v-39c0e2c5>${ssrInterpolate(unref(input))}</textarea></form></div><button type="button"${ssrIncludeBooleanAttr(unref(isChatBusy) ? false : !unref(canSendMessage)) ? " disabled" : ""} class="${ssrRenderClass([
        "text-white font-medium px-5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed min-w-[48px] h-12",
        unref(isChatBusy) ? "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700" : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400"
      ])}" data-v-39c0e2c5>`);
      if (unref(isChatBusy)) {
        _push(ssrRenderComponent(unref(SquareIcon), { class: "w-5 h-5" }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(SendIcon), { class: "w-5 h-5" }, null, _parent));
      }
      _push(`</button></div></div></div></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/chat-old.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const chatOld = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-39c0e2c5"]]);

export { chatOld as default };
//# sourceMappingURL=chat-old-DaaS3F8V.mjs.map
