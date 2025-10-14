import { ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrIncludeBooleanAttr, ssrRenderComponent, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
import { SparklesIcon, ChevronDownIcon } from 'lucide-vue-next';

const _sfc_main = {
  __name: "ModelSelector",
  __ssrInlineRender: true,
  props: {
    modelValue: {
      type: String,
      default: "gemini-2.5-flash"
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ["update:modelValue"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const isOpen = ref(false);
    const models = [
      {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        description: "Most capable model for complex tasks"
      },
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        description: "Fast and efficient, great for most tasks"
      }
    ];
    const selectedModel = computed(() => {
      return models.find((m) => m.id === props.modelValue) || models[0];
    });
    const dropdown = ref(null);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        ref_key: "dropdown",
        ref: dropdown,
        class: "relative"
      }, _attrs))}><button${ssrIncludeBooleanAttr(__props.disabled) ? " disabled" : ""} class="${ssrRenderClass([{ "ring-2 ring-indigo-500 ring-offset-1": unref(isOpen) }, "flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white hover:border-indigo-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"])}">`);
      _push(ssrRenderComponent(unref(SparklesIcon), { class: "w-4 h-4 text-indigo-600" }, null, _parent));
      _push(`<div class="flex flex-col items-start text-left"><span class="text-xs font-semibold text-gray-900">${ssrInterpolate(unref(selectedModel).name)}</span><span class="text-xs text-gray-500 hidden sm:block">${ssrInterpolate(unref(selectedModel).description)}</span></div>`);
      _push(ssrRenderComponent(unref(ChevronDownIcon), {
        class: ["w-4 h-4 text-gray-500 ml-1 transition-transform", { "rotate-180": unref(isOpen) }]
      }, null, _parent));
      _push(`</button>`);
      if (unref(isOpen)) {
        _push(`<div class="absolute z-50 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"><div class="py-1"><!--[-->`);
        ssrRenderList(models, (model) => {
          _push(`<button class="${ssrRenderClass([{ "bg-indigo-100": __props.modelValue === model.id }, "w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors group"])}"><div class="flex items-start gap-3">`);
          _push(ssrRenderComponent(unref(SparklesIcon), {
            class: ["w-5 h-5 mt-0.5 flex-shrink-0", __props.modelValue === model.id ? "text-indigo-600" : "text-gray-400 group-hover:text-indigo-500"]
          }, null, _parent));
          _push(`<div class="flex-1 min-w-0"><div class="flex items-center gap-2"><span class="${ssrRenderClass([__props.modelValue === model.id ? "text-indigo-900" : "text-gray-900", "font-semibold text-sm"])}">${ssrInterpolate(model.name)}</span>`);
          if (__props.modelValue === model.id) {
            _push(`<span class="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full"> Active </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><p class="text-xs text-gray-600 mt-0.5">${ssrInterpolate(model.description)}</p></div></div></button>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ModelSelector.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=ModelSelector-C3IuM3HR.mjs.map
