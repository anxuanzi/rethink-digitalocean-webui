<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'

/** Type-to-confirm destroy. On success, return to the list (the detail page would 404). */
const props = defineProps<{ database: DatabaseCluster }>()
const emit = defineEmits<{ close: [done?: boolean] }>()

const actions = useDatabaseActions()
const confirmText = ref('')
const submitting = ref(false)
const canDestroy = computed(() => confirmText.value.trim() === props.database.name)

async function onConfirm() {
  if (!canDestroy.value) return
  submitting.value = true
  const ok = await actions.destroy(props.database)
  submitting.value = false
  if (ok) {
    emit('close', true)
    await navigateTo('/databases')
  }
}
</script>

<template>
  <UModal
    title="Destroy database cluster"
    :close="{ onClick: () => emit('close') }"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <UAlert
          color="error"
          variant="subtle"
          icon="i-lucide-alert-triangle"
          title="This permanently destroys the cluster"
          :description="`All data, users, and backups for ${database.name} will be lost. This cannot be undone.`"
        />
        <UFormField
          label="Type the cluster name to confirm"
          name="confirm"
        >
          <UInput
            v-model="confirmText"
            :placeholder="database.name"
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
        label="Destroy cluster"
        color="error"
        :loading="submitting"
        :disabled="!canDestroy"
        @click="onConfirm"
      />
    </template>
  </UModal>
</template>
