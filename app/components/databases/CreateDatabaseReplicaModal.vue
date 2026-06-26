<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'

const props = defineProps<{ database: DatabaseCluster }>()
const emit = defineEmits<{ close: [done?: boolean] }>()

const actions = useDatabaseActions()
const name = ref('')
const submitting = ref(false)

const valid = computed(() => /^[a-zA-Z0-9_-]+$/.test(name.value.trim()))

async function onConfirm() {
  if (!valid.value) return
  submitting.value = true
  const ok = await actions.createReplica(props.database, { name: name.value.trim() })
  submitting.value = false
  if (ok) emit('close', true)
}
</script>

<template>
  <UModal
    title="Create read-only replica"
    :description="`Add a replica of ${database.name}.`"
    :close="{ onClick: () => emit('close') }"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <UFormField
        label="Replica name"
        name="name"
        :error="name.trim().length > 0 && !valid ? 'Use letters, numbers, underscores, and hyphens' : undefined"
      >
        <UInput
          v-model="name"
          placeholder="replica-1"
          autocomplete="off"
          class="w-full"
          @keydown.enter="onConfirm"
        />
      </UFormField>
      <p class="text-xs text-muted mt-2">
        The replica is created in the primary's region with matching hardware. It stays read-only and replicates continuously.
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
        label="Create replica"
        :loading="submitting"
        :disabled="!valid"
        @click="onConfirm"
      />
    </template>
  </UModal>
</template>
