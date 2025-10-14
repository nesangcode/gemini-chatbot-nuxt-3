<template>
  <div
    :class="[
      'flex gap-2 md:gap-3 animate-fade-in',
      message.role === 'user' ? 'justify-end' : 'justify-start'
    ]"
  >
    <!-- Avatar -->
    <div v-if="message.role === 'assistant'" class="flex-shrink-0">
      <div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
        <BotIcon class="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
      </div>
    </div>
    
    <!-- Message Content -->
    <div
      :class="[
        'max-w-[85%] md:max-w-2xl px-3 md:px-5 py-2 md:py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md',
        message.role === 'user'
          ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-tr-sm'
          : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
      ]"
    >
      <!-- Images -->
      <div v-if="images.length > 0" class="mb-2 md:mb-3 flex flex-wrap gap-2">
        <img
          v-for="(image, idx) in images"
          :key="idx"
          :src="image"
          alt="Uploaded image"
          class="rounded-lg w-full max-w-[200px] md:max-w-xs max-h-48 md:max-h-64 object-contain border border-gray-200"
          loading="lazy"
        />
      </div>

      <!-- PDFs -->
      <div v-if="pdfs.length > 0" class="mb-2 md:mb-3 space-y-2">
        <div
          v-for="(pdf, idx) in pdfs"
          :key="idx"
          :class="[
            'flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg',
            message.role === 'user' ? 'bg-white/20' : 'bg-gray-100'
          ]"
        >
          <FileTextIcon class="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
          <span class="text-xs md:text-sm truncate">{{ pdf.name }}</span>
        </div>
      </div>

      <!-- Text Content -->
      <div
        v-if="text"
        v-html="formattedText"
        :class="[
          'prose prose-sm max-w-none',
          message.role === 'user' ? 'prose-invert' : ''
        ]"
      />
    </div>
    
    <!-- User Avatar -->
    <div v-if="message.role === 'user'" class="flex-shrink-0">
      <div class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
        <UserCircle2Icon class="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { BotIcon, UserCircle2Icon, FileTextIcon } from 'lucide-vue-next'

const props = defineProps({
  message: { type: Object, required: true }
})

// Extract images from message
const images = computed(() => {
  // AI SDK parts format
  if (props.message.parts && Array.isArray(props.message.parts)) {
    return props.message.parts
      .filter((part) => part.type === 'image')
      .map((part) => part.image)
      .filter((img) => img)
  }
  
  // Check if content is an array of parts
  if (Array.isArray(props.message.content)) {
    return props.message.content
      .filter((part) => part.type === 'image')
      .map((part) => part.image)
      .filter((img) => img)
  }
  
  // AI SDK experimental_attachments format
  if (props.message.experimental_attachments && Array.isArray(props.message.experimental_attachments)) {
    return props.message.experimental_attachments
      .filter((att) => att.contentType?.startsWith('image/'))
      .map((att) => att.url)
      .filter((url) => url)
  }
  
  return []
})

// Extract PDFs from message
const pdfs = computed(() => {
  // AI SDK parts format
  if (props.message.parts && Array.isArray(props.message.parts)) {
    return props.message.parts
      .filter((part) => part.type === 'file')
      .map((part) => ({ 
        name: part.name || 'document.pdf', 
        mimeType: part.mimeType || 'application/pdf'
      }))
  }
  
  // Check if content is an array of parts
  if (Array.isArray(props.message.content)) {
    return props.message.content
      .filter((part) => part.type === 'file')
      .map((part) => ({ 
        name: part.name || 'document.pdf', 
        mimeType: part.mimeType || 'application/pdf'
      }))
  }
  
  // AI SDK experimental_attachments format
  if (props.message.experimental_attachments && Array.isArray(props.message.experimental_attachments)) {
    return props.message.experimental_attachments
      .filter((att) => att.contentType === 'application/pdf')
      .map((att) => ({ 
        name: att.name || 'document.pdf',
        mimeType: att.contentType
      }))
  }
  
  return []
})

// Extract text from message
const text = computed(() => {
  // AI SDK text-only format: { text: "..." }
  if (props.message.text) {
    return props.message.text
  }
  
  // AI SDK parts format: { parts: [...] }
  if (props.message.parts && Array.isArray(props.message.parts)) {
    // Filter out non-content parts (step-start, step-finish, etc)
    const textPart = props.message.parts.find((part) => 
      part.type === 'text' && part.text
    )
    return textPart?.text || ''
  }
  
  // Plain string content
  if (typeof props.message.content === 'string') {
    return props.message.content
  }
  
  // Array content - extract text part
  if (Array.isArray(props.message.content)) {
    const textPart = props.message.content.find((part) => part.type === 'text')
    return textPart?.text || ''
  }
  
  return ''
})

// Use markdown-it for proper markdown parsing
const { $renderMarkdown } = useNuxtApp()

const formattedText = computed(() => {
  if (!text.value) return ''
  return $renderMarkdown(text.value)
})
</script>

<style scoped>
/* Paragraph spacing */
.prose :deep(p) {
  margin: 0.5em 0;
}

.prose :deep(p:first-child) {
  margin-top: 0;
}

.prose :deep(p:last-child) {
  margin-bottom: 0;
}

/* Heading styles */
.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3),
.prose :deep(h4),
.prose :deep(h5),
.prose :deep(h6) {
  font-weight: 600;
  margin-top: 1em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

.prose :deep(h1:first-child),
.prose :deep(h2:first-child),
.prose :deep(h3:first-child),
.prose :deep(h4:first-child),
.prose :deep(h5:first-child),
.prose :deep(h6:first-child) {
  margin-top: 0;
}

.prose :deep(h1) { font-size: 1.5em; }
.prose :deep(h2) { font-size: 1.3em; }
.prose :deep(h3) { font-size: 1.15em; }
.prose :deep(h4) { font-size: 1.05em; }
.prose :deep(h5) { font-size: 0.95em; }
.prose :deep(h6) { font-size: 0.875em; }

/* Lists */
.prose :deep(ul),
.prose :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.prose :deep(li) {
  margin: 0.25em 0;
}

/* Code blocks */
.prose :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 1em;
  border-radius: 0.5em;
  overflow-x: auto;
  margin: 0.75em 0;
}

.prose :deep(pre code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
  font-size: 0.875em;
  color: inherit;
}

/* Inline code */
.prose :deep(code) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 0.2em 0.4em;
  border-radius: 0.25em;
  font-size: 0.875em;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

/* Blockquotes */
.prose :deep(blockquote) {
  border-left: 3px solid #cbd5e1;
  padding-left: 1em;
  margin: 0.75em 0;
  color: #64748b;
}

/* Links */
.prose :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.prose :deep(a:hover) {
  color: #2563eb;
}

/* Inverted styles for user messages */
.prose-invert :deep(pre) {
  background: rgba(255, 255, 255, 0.1);
}

.prose-invert :deep(code) {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.prose-invert :deep(blockquote) {
  border-left-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
}

.prose-invert :deep(a) {
  color: #93c5fd;
}

.prose-invert :deep(a:hover) {
  color: #bfdbfe;
}
</style>
