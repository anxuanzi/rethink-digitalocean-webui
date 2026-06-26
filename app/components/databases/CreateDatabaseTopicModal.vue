<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'

const props = defineProps<{ database: DatabaseCluster }>()
const emit = defineEmits<{ close: [done?: boolean] }>()

const actions = useDatabaseActions()
const name = ref('')
const partitions = ref(3)
const replication = ref(2)
const submitting = ref(false)

const valid = computed(() => /^[a-zA-Z0-9._-]+$/.test(name.value.trim()))

async function onConfirm() {
  if (!valid.value) return
  submitting.value = true
  const ok = await actions.createTopic(props.database, {
    name: name.value.trim(),
    partition_count: partitions.value,
    replication_factor: replication.value
  })
  submitting.value = false
  if (ok) emit('close', true)
}
</script>

<template>
  <UModal
    title="Create topic"
    :description="`Add a Kafka topic to ${database.name}.`"
    :close="{ onClick: () => emit('close') }"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField
          label="Name"
          name="name"
          :error="name.trim().length > 0 && !valid ? 'Use letters, numbers, dots, underscores, and hyphens' : undefined"
        >
          <UInput
            v-model="name"
            placeholder="events"
            autocomplete="off"
            class="w-full"
            @keydown.enter="onConfirm"
          />
        </UFormField>
        <UFormField
          label="Partitions"
          name="partitions"
        >
          <UInput
            v-model.number="partitions"
            type="number"
            :min="1"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Replication factor"
          name="replication"
        >
          <UInput
            v-model.number="replication"
            type="number"
            :min="1"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <UButton
        label="Cancel"
        color="neutral"
        variant="ghost"
        @click="emit('close')"
      />
      <UButton
        label="Create topic"
        :loading="submitting"
        :disabled="!valid"
        @click="onConfirm"
      />
    </template>
  </UModal>
</template>
