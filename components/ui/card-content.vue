<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '~/lib/utils'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ class?: string }>()
const attrs = useAttrs()

const mergedAttrs = computed(() => {
  const { class: className, ...rest } = attrs as Record<string, unknown> & { class?: string }
  return {
    ...rest,
    class: cn('p-6 pt-0', className as string, props.class)
  }
})
</script>

<template>
  <div v-bind="mergedAttrs">
    <slot />
  </div>
</template>
