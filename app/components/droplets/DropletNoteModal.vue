<script setup lang="ts">
import type { Droplet } from '~/types/droplet'

const props = defineProps<{ droplet: Droplet }>()
const emit = defineEmits<{ close: [done?: boolean] }>()

const notes = useDropletNotesStore()
const text = ref(notes.getNote(props.droplet.id))

function onSave() {
  notes.setNote(props.droplet.id, text.value)
  emit('close', true)
}
</script>

<template>
  <UModal
    title="Droplet note"
    :description="`A private note for ${droplet.name}, stored only in this browser.`"
    :close="{ onClick: () => emit('close') }"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <UFormField
        label="Note"
        name="note"
      >
        <UTextarea
          v-model="text"
          :rows="4"
          autoresize
          class="w-full"
          placeholder="e.g. Primary API server — do not power off during business hours"
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
        label="Save note"
        @click="onSave"
      />
    </template>
  </UModal>
</template>
