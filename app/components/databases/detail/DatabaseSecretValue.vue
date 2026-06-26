<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

/**
 * A sensitive value (password, connection string) shown masked by default, with reveal + copy.
 * Copy always copies the real value regardless of reveal state, so users can paste without exposing it.
 * Tolerates a missing value — read-only API tokens redact credentials, so we show an em-dash then.
 */
const props = defineProps<{ value?: string | null, label: string }>()

const revealed = ref(false)
const toast = useToast()

const val = computed(() => props.value ?? '')
const hasValue = computed(() => val.value.length > 0)
const { copy, copied, isSupported } = useClipboard({ source: () => val.value })

// A fixed-ish mask so the field width doesn't telegraph the secret's length.
const masked = computed(() => '•'.repeat(Math.min(Math.max(val.value.length, 12), 28)))

async function onCopy() {
  await copy(val.value)
  toast.add({ title: 'Copied', description: `${props.label} copied to clipboard`, color: 'success', icon: 'i-lucide-check' })
}
</script>

<template>
  <span
    v-if="!hasValue"
    class="text-sm text-dimmed"
  >—</span>

  <div
    v-else
    class="inline-flex items-center gap-1 min-w-0"
  >
    <span class="font-mono text-sm text-highlighted truncate">
      {{ revealed ? val : masked }}
    </span>
    <UButton
      :icon="revealed ? 'i-lucide-eye-off' : 'i-lucide-eye'"
      color="neutral"
      variant="ghost"
      size="xs"
      :aria-label="revealed ? `Hide ${label}` : `Reveal ${label}`"
      @click="revealed = !revealed"
    />
    <UButton
      v-if="isSupported"
      :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
      :color="copied ? 'success' : 'neutral'"
      variant="ghost"
      size="xs"
      :aria-label="`Copy ${label}`"
      @click="onCopy"
    />
  </div>
</template>
