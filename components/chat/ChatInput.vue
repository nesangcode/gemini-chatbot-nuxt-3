<template>
  <div class="border-t border-gray-200/50 bg-white/80 backdrop-blur-xl p-3 md:p-4">
    <!-- File Previews -->
    <div v-if="selectedImages.length > 0 || selectedPdfs.length > 0" class="mb-2 md:mb-3 flex flex-wrap gap-2">
      <!-- Image Previews -->
      <div v-for="(image, idx) in selectedImages" :key="`img-${idx}`" class="relative group">
        <img :src="image.preview" alt="Preview" class="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg border-2 border-indigo-200" />
        <button
          @click="$emit('remove-image', idx)"
          class="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 text-white rounded-full p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <XIcon class="w-3 h-3" />
        </button>
      </div>

      <!-- PDF Previews -->
      <div v-for="(pdf, idx) in selectedPdfs" :key="`pdf-${idx}`" class="relative group bg-gray-100 rounded-lg p-2 pr-8 flex items-center gap-1.5 md:gap-2 border-2 border-indigo-200">
        <FileTextIcon class="w-4 h-4 md:w-5 md:h-5 text-gray-600 flex-shrink-0" />
        <div class="min-w-0">
          <p class="text-xs font-medium text-gray-900 truncate max-w-[100px] md:max-w-[150px]">{{ pdf.name }}</p>
          <p class="text-xs text-gray-500">{{ formatFileSize(pdf.size) }}</p>
        </div>
        <button
          @click="$emit('remove-pdf', idx)"
          class="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 text-white rounded-full p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <XIcon class="w-3 h-3" />
        </button>
      </div>
    </div>

    <!-- Input Area -->
    <div class="flex items-end gap-1.5 md:gap-2">
      <!-- File Upload Buttons -->
      <div class="flex gap-0.5 md:gap-1">
        <button
          @click="$emit('trigger-image-upload')"
          :disabled="disabled"
          class="p-2 md:p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Upload gambar"
        >
          <ImagePlusIcon class="w-5 h-5" />
        </button>
        
        <button
          @click="$emit('trigger-pdf-upload')"
          :disabled="disabled"
          class="p-2 md:p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Upload PDF"
        >
          <FileTextIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Text Input -->
      <div class="flex-1 relative">
        <textarea
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          @keydown.enter.ctrl.prevent="$emit('send')"
          @keydown.enter.meta.prevent="$emit('send')"
          ref="inputRef"
          :disabled="disabled"
          placeholder="Ketik pesan..."
          rows="1"
          class="w-full px-3 md:px-4 py-2.5 md:py-3 pr-10 md:pr-12 rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm md:text-base"
          style="min-height: 44px; max-height: 200px;"
        />
      </div>

      <!-- Send/Stop Button -->
      <button
        v-if="!isBusy"
        @click="$emit('send')"
        :disabled="!canSend"
        class="p-2.5 md:p-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
      >
        <SendIcon class="w-4.5 h-4.5 md:w-5 md:h-5" />
      </button>
      
      <button
        v-else
        @click="$emit('stop')"
        class="p-2.5 md:p-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <SquareIcon class="w-4.5 h-4.5 md:w-5 md:h-5" />
      </button>
    </div>

    <!-- Helper Text -->
    <p class="text-xs text-gray-500 mt-2 text-center hidden md:block">
      Tekan <kbd class="px-2 py-0.5 bg-gray-200 rounded text-xs">Ctrl+Enter</kbd> untuk kirim, <kbd class="px-2 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> untuk baris baru
    </p>
  </div>
</template>

<script setup>
import { SendIcon, SquareIcon, ImagePlusIcon, FileTextIcon, XIcon } from 'lucide-vue-next'

defineProps({
  modelValue: { type: String, required: true },
  canSend: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  isBusy: { type: Boolean, default: false },
  selectedImages: { type: Array, default: () => [] },
  selectedPdfs: { type: Array, default: () => [] }
})

defineEmits(['update:modelValue', 'send', 'stop', 'trigger-image-upload', 'trigger-pdf-upload', 'remove-image', 'remove-pdf'])

const inputRef = ref(null)

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

defineExpose({ inputRef })
</script>
