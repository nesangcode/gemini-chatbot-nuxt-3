<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

defineOptions({ inheritAttrs: false })

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

interface ButtonProps extends /* @vue-ignore */ VariantProps<typeof buttonVariants> {
  as?: string
}

const props = withDefaults(defineProps<ButtonProps>(), {
  as: 'button'
})

const attrs = useAttrs()

const mergedAttrs = computed(() => {
  const { class: className, ...rest } = attrs as Record<string, unknown> & { class?: string }
  return {
    ...rest,
    class: cn(buttonVariants({ variant: props.variant, size: props.size }), className as string)
  }
})
</script>

<template>
  <component :is="props.as" v-bind="mergedAttrs">
    <slot />
  </component>
</template>
