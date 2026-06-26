<script setup lang="ts">
import type { Droplet } from '~/types/droplet'

const props = defineProps<{ droplet: Droplet }>()
const emit = defineEmits<{ close: [done?: boolean] }>()

const actions = useDropletActions()
const name = ref(`${props.droplet.name}-${new Date().toISOString().slice(0, 10)}`)
const submitting = ref(false)

async function onConfirm() {
  if (!name.value.trim()) return
  submitting.value = true
  await actions.snapshot(props.droplet, name.value.trim())
  submitting.value = false
  emit('close', true)
}
</script>

<template>
  <UModal
    title="Take snapshot"
    :description="`Create a snapshot of ${droplet.name}.`"
    :close="{ onClick: () => emit('close') }"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <UFormField
        label="Snapshot name"
        name="name"
      >
        <UInput
          v-model="name"
          class="w-full"
          autofocus
        />
      </UFormField>
      <p class="text-xs text-muted mt-2">
        Snapshots are billed per GB. Powering off the Droplet first produces a more consistent snapshot.
      </p>
    </template>
    <template #footer>
      <UButton
        label="Cancel"
        color="neutral"
        variant="ghost"
        @click="emit('close')"
      />
      <UButton
        label="Take snapshot"
        :loading="submitting"
        @click="onConfirm"
      />
    </template>
  </UModal>
</template>
