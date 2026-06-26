<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'

const props = defineProps<{ database: DatabaseCluster }>()
const emit = defineEmits<{ close: [done?: boolean] }>()

const actions = useDatabaseActions()
const name = ref('')
const submitting = ref(false)

const trimmed = computed(() => name.value.trim())
const valid = computed(() => /^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/.test(trimmed.value))

async function onConfirm() {
  if (!valid.value) return
  submitting.value = true
  const ok = await actions.createDb(props.database, trimmed.value)
  submitting.value = false
  if (ok) emit('close', true)
}
</script>

<template>
  <UModal
    title="Create database"
    :description="`Add a new logical database to ${database.name}.`"
    :close="{ onClick: () => emit('close') }"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <UFormField
        label="Database name"
        name="name"
        :error="trimmed.length > 0 && !valid ? 'Use letters, numbers, underscores, and hyphens' : undefined"
      >
        <UInput
          v-model="name"
          placeholder="analytics"
          autocomplete="off"
          class="w-full"
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
        label="Create database"
        :loading="submitting"
        :disabled="!valid"
        @click="onConfirm"
      />
    </template>
  </UModal>
</template>
