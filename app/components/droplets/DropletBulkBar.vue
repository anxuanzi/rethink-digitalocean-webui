<script setup lang="ts">
import type { Droplet } from '~/types/droplet'

/**
 * Bulk action bar shown above the table whenever one or more Droplets are selected.
 * Power/Reboot run optimistically through the shared action layer; Destroy gates behind a
 * small typed-free confirm (count is explicit, so no name-typing here) and clears the
 * selection once a bulk operation is fired.
 */
const props = defineProps<{ selected: Droplet[] }>()
const emit = defineEmits<{ clear: [] }>()

const actions = useDropletActions()

const count = computed(() => props.selected.length)
const noun = computed(() => (count.value === 1 ? 'Droplet' : 'Droplets'))
const running = ref(false)
const confirmOpen = ref(false)

async function runPower(type: 'power_on' | 'power_off' | 'reboot') {
  if (!count.value || running.value) return
  const batch = props.selected
  const config = {
    power_on: { optimisticStatus: 'active' as const, label: 'Powered on' },
    power_off: { optimisticStatus: 'off' as const, label: 'Powered off' },
    reboot: { optimisticStatus: undefined, label: 'Rebooted' }
  }[type]
  running.value = true
  emit('clear')
  await actions.bulkAction(batch, { type }, config)
  running.value = false
}

async function confirmDestroy() {
  if (!count.value || running.value) return
  const batch = props.selected
  running.value = true
  confirmOpen.value = false
  emit('clear')
  await actions.bulkDestroy(batch)
  running.value = false
}
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
  >
    <span class="text-sm font-medium text-highlighted tabular-nums">
      {{ count }} {{ noun }} selected
    </span>

    <div class="flex items-center gap-1.5 ms-auto">
      <UButton
        label="Power on"
        icon="i-lucide-power"
        size="sm"
        color="neutral"
        variant="outline"
        :disabled="running"
        @click="runPower('power_on')"
      />
      <UButton
        label="Power off"
        icon="i-lucide-power-off"
        size="sm"
        color="neutral"
        variant="outline"
        :disabled="running"
        @click="runPower('power_off')"
      />
      <UButton
        label="Reboot"
        icon="i-lucide-rotate-cw"
        size="sm"
        color="neutral"
        variant="outline"
        :disabled="running"
        @click="runPower('reboot')"
      />
      <UButton
        label="Destroy"
        icon="i-lucide-trash-2"
        size="sm"
        color="error"
        variant="soft"
        :disabled="running"
        @click="confirmOpen = true"
      />
      <UButton
        label="Clear"
        icon="i-lucide-x"
        size="sm"
        color="neutral"
        variant="ghost"
        :disabled="running"
        @click="emit('clear')"
      />
    </div>

    <UModal
      v-model:open="confirmOpen"
      title="Destroy selected Droplets"
      :description="`Permanently destroy ${count} ${noun}? Everything on them will be lost. This cannot be undone.`"
      :ui="{ footer: 'justify-end' }"
    >
      <template #footer="{ close }">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          @click="close"
        />
        <UButton
          :label="`Destroy ${count} ${noun}`"
          color="error"
          icon="i-lucide-trash-2"
          @click="confirmDestroy"
        />
      </template>
    </UModal>
  </div>
</template>
