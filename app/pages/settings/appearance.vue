<script setup lang="ts">
useHead({ title: 'Appearance' })

const colorMode = useColorMode()

const options = [
  { value: 'system', label: 'System', description: 'Match your device', icon: 'i-lucide-monitor' },
  { value: 'light', label: 'Light', description: 'Always light', icon: 'i-lucide-sun' },
  { value: 'dark', label: 'Dark', description: 'Always dark', icon: 'i-lucide-moon' }
] as const
</script>

<template>
  <div class="flex flex-col gap-6 w-full lg:max-w-2xl mx-auto">
    <div>
      <h2 class="text-sm font-medium text-highlighted">
        Theme
      </h2>
      <p class="text-sm text-muted">
        Choose how the console looks. System follows your device automatically.
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :aria-pressed="colorMode.preference === option.value"
        class="cursor-pointer rounded-lg border p-4 flex flex-col items-start gap-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :class="colorMode.preference === option.value
          ? 'border-primary bg-primary/5'
          : 'border-default hover:bg-elevated/50'"
        @click="colorMode.preference = option.value"
      >
        <UIcon
          :name="option.icon"
          class="size-5"
          :class="colorMode.preference === option.value ? 'text-primary' : 'text-muted'"
        />
        <span class="text-sm font-medium text-highlighted">{{ option.label }}</span>
        <span class="text-xs text-muted">{{ option.description }}</span>
      </button>
    </div>
  </div>
</template>
