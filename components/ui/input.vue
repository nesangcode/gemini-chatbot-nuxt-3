<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '~/lib/utils'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  class?: string
  modelValue?: string | number | null
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | number | null): void
  (event: 'input', value: Event): void
}>()

const attrs = useAttrs()

const mergedAttrs = computed(() => {
  const { class: className, modelValue: _modelValue, 'onUpdate:modelValue': _onUpdateModelValue, ...rest } =
    attrs as Record<string, unknown> & { class?: string; modelValue?: unknown; 'onUpdate:modelValue'?: unknown }

  return {
    ...rest,
    class: cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className as string,
      props.class
    )
  }
})

const innerValue = computed({
  get: () => (props.modelValue ?? '') as string | number,
  set: (value: string | number) => {
    emit('update:modelValue', value)
  }
})

function handleInput(event: Event) {
  emit('input', event)
}
</script>

<template>
  <input v-bind="mergedAttrs" v-model="innerValue" @input="handleInput" />
</template>
