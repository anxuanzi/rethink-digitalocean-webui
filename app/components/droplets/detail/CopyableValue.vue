<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const props = defineProps<{
  value: string
  label: string
}>()

const toast = useToast()
const { copy, copied, isSupported } = useClipboard({ source: () => props.value })

async function onCopy() {
  await copy(props.value)
  toast.add({ title: 'Copied', description: `${props.label} copied to clipboard`, color: 'success', icon: 'i-lucide-check' })
}
</script>

<template>
  <button
    v-if="isSupported"
    type="button"
    class="group inline-flex items-center gap-2 font-mono text-sm text-highlighted rounded-md px-2 py-1 -mx-2 hover:bg-elevated focus-visible:outline-2 focus-visible:outline-primary transition-colors"
    :aria-label="`Copy ${label}`"
    :title="`Copy ${label}`"
    @click="onCopy"
  >
    <span class="truncate">{{ value }}</span>
    <UIcon
      :name="copied ? 'i-lucide-check' : 'i-lucide-copy'"
      class="size-3.5 shrink-0 transition-colors"
      :class="copied ? 'text-success' : 'text-dimmed group-hover:text-muted'"
    />
  </button>
  <span
    v-else
    class="font-mono text-sm text-highlighted"
  >{{ value }}</span>
</template>
