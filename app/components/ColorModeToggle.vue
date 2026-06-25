<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{ collapsed?: boolean }>()

const colorMode = useColorMode()

const modes = [
  { value: 'system', label: 'System', icon: 'i-lucide-monitor' },
  { value: 'light', label: 'Light', icon: 'i-lucide-sun' },
  { value: 'dark', label: 'Dark', icon: 'i-lucide-moon' }
] as const

const current = computed(() => modes.find(m => m.value === colorMode.preference) ?? modes[0])

const items = computed<DropdownMenuItem[]>(() =>
  modes.map(mode => ({
    label: mode.label,
    icon: mode.icon,
    color: colorMode.preference === mode.value ? 'primary' : undefined,
    onSelect: () => { colorMode.preference = mode.value }
  }))
)
</script>

<template>
  <UDropdownMenu
    :items="[items]"
    :content="{ side: 'top', align: 'start' }"
    class="w-full"
  >
    <UButton
      color="neutral"
      variant="ghost"
      block
      class="justify-start gap-2"
      :square="collapsed"
      :aria-label="`Theme: ${current.label}`"
    >
      <UIcon
        :name="current.icon"
        class="size-5 shrink-0"
      />
      <span
        v-if="!collapsed"
        class="truncate text-left flex-1"
      >{{ current.label }}</span>
    </UButton>
  </UDropdownMenu>
</template>
