<script setup lang="ts">
import type { Droplet } from '~/types/droplet'

const props = defineProps<{ droplet: Droplet }>()
const emit = defineEmits<{ close: [done?: boolean] }>()

const actions = useDropletActions()
const confirmText = ref('')
const submitting = ref(false)
const canDestroy = computed(() => confirmText.value.trim() === props.droplet.name)

async function onConfirm() {
  if (!canDestroy.value) return
  submitting.value = true
  await actions.destroy(props.droplet)
  submitting.value = false
  emit('close', true)
}
</script>

<template>
  <UModal
    title="Destroy Droplet"
    :close="{ onClick: () => emit('close') }"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <UAlert
          color="error"
          variant="subtle"
          icon="i-lucide-alert-triangle"
          title="This permanently destroys the Droplet"
          :description="`Everything on ${droplet.name} will be lost. This cannot be undone.`"
        />
        <UFormField
          label="Type the Droplet name to confirm"
          name="confirm"
        >
          <UInput
            v-model="confirmText"
            :placeholder="droplet.name"
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
        label="Destroy"
        color="error"
        :loading="submitting"
        :disabled="!canDestroy"
        @click="onConfirm"
      />
    </template>
  </UModal>
</template>
