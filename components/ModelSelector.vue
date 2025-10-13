<script setup>
import { SparklesIcon, ChevronDownIcon } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'gemini-2.5-flash'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)

const models = [
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Most capable model for complex tasks'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast and efficient, great for most tasks'
  }
]

const selectedModel = computed(() => {
  return models.find(m => m.id === props.modelValue) || models[0]
})

function selectModel(modelId) {
  emit('update:modelValue', modelId)
  isOpen.value = false
}

// Close dropdown when clicking outside
const dropdown = ref(null)
onMounted(() => {
  const handleClickOutside = (event) => {
    if (dropdown.value && !dropdown.value.contains(event.target)) {
      isOpen.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

<template>
  <div ref="dropdown" class="relative">
    <button
      @click="isOpen = !isOpen"
      :disabled="disabled"
      class="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white hover:border-indigo-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      :class="{ 'ring-2 ring-indigo-500 ring-offset-1': isOpen }"
    >
      <SparklesIcon class="w-4 h-4 text-indigo-600" />
      <div class="flex flex-col items-start text-left">
        <span class="text-xs font-semibold text-gray-900">{{ selectedModel.name }}</span>
        <span class="text-xs text-gray-500 hidden sm:block">{{ selectedModel.description }}</span>
      </div>
      <ChevronDownIcon 
        class="w-4 h-4 text-gray-500 ml-1 transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
      >
        <div class="py-1">
          <button
            v-for="model in models"
            :key="model.id"
            @click="selectModel(model.id)"
            class="w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors group"
            :class="{ 'bg-indigo-100': modelValue === model.id }"
          >
            <div class="flex items-start gap-3">
              <SparklesIcon 
                class="w-5 h-5 mt-0.5 flex-shrink-0"
                :class="modelValue === model.id ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span 
                    class="font-semibold text-sm"
                    :class="modelValue === model.id ? 'text-indigo-900' : 'text-gray-900'"
                  >
                    {{ model.name }}
                  </span>
                  <span 
                    v-if="modelValue === model.id"
                    class="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full"
                  >
                    Active
                  </span>
                </div>
                <p class="text-xs text-gray-600 mt-0.5">{{ model.description }}</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
