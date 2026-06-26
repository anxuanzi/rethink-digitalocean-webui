<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'

const props = defineProps<{ database: DatabaseCluster }>()
const emit = defineEmits<{ close: [done?: boolean] }>()

const actions = useDatabaseActions()

const name = ref('')
const mode = ref('transaction')
const size = ref(10)
const db = ref('defaultdb')
const user = ref('doadmin')
const submitting = ref(false)

const modeItems = [
  { label: 'Transaction', value: 'transaction' },
  { label: 'Session', value: 'session' },
  { label: 'Statement', value: 'statement' }
]

const nameValid = computed(() => /^[a-zA-Z0-9_-]+$/.test(name.value.trim()))
const valid = computed(() => nameValid.value && !!db.value.trim() && !!user.value.trim() && size.value >= 1)

async function onConfirm() {
  if (!valid.value) return
  submitting.value = true
  const ok = await actions.createPool(props.database, {
    name: name.value.trim(),
    mode: mode.value,
    size: size.value,
    db: db.value.trim(),
    user: user.value.trim()
  })
  submitting.value = false
  if (ok) emit('close', true)
}
</script>

<template>
  <UModal
    title="Create connection pool"
    :description="`Pool connections for ${database.name}.`"
    :close="{ onClick: () => emit('close') }"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField
          label="Name"
          name="name"
          :error="name.trim().length > 0 && !nameValid ? 'Use letters, numbers, underscores, and hyphens' : undefined"
        >
          <UInput
            v-model="name"
            placeholder="pool-transaction"
            autocomplete="off"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Mode"
          name="mode"
        >
          <USelect
            v-model="mode"
            :items="modeItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Pool size"
          name="size"
        >
          <UInput
            v-model.number="size"
            type="number"
            :min="1"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Database"
          name="db"
        >
          <UInput
            v-model="db"
            autocomplete="off"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="User"
          name="user"
        >
          <UInput
            v-model="user"
            autocomplete="off"
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
        label="Create pool"
        :loading="submitting"
        :disabled="!valid"
        @click="onConfirm"
      />
    </template>
  </UModal>
</template>
