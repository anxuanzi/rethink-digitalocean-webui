<script setup lang="ts">
import type { Droplet } from '~/types/droplet'

const props = defineProps<{ droplet: Droplet }>()
const emit = defineEmits<{ close: [done?: boolean] }>()

const actions = useDropletActions()
const name = ref(props.droplet.name)
const submitting = ref(false)

async function onConfirm() {
  const next = name.value.trim()
  if (!next || next === props.droplet.name) {
    emit('close')
    return
  }
  submitting.value = true
  await actions.rename(props.droplet, next)
  submitting.value = false
  emit('close', true)
}
</script>

<template>
  <UModal
    title="Rename Droplet"
    :close="{ onClick: () => emit('close') }"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <UFormField
        label="Name"
        name="name"
      >
        <UInput
          v-model="name"
          class="w-full"
          autofocus
          @keydown.enter="onConfirm"
        />
      </UFormField>
    </template>
    <template #footer>
      <UButton
        label="Cancel"
        color="neutral"
        variant="ghost"
        @click="emit('close')"
      />
      <UButton
        label="Rename"
        :loading="submitting"
        @click="onConfirm"
      />
    </template>
  </UModal>
</template>
