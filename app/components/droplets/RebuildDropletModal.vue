<script setup lang="ts">
import type { Droplet } from '~/types/droplet'

const props = defineProps<{ droplet: Droplet }>()
const emit = defineEmits<{ close: [done?: boolean] }>()

const api = useDoApi()
const auth = useDoAuthStore()
const actions = useDropletActions()

const { state } = useQuery({
  key: () => lookupKeys.images(auth.activeId, 'distribution'),
  query: () => api.images.list('distribution'),
  enabled: () => auth.isConnected
})

const imageItems = computed(() =>
  (state.value.data?.images ?? []).map(i => ({ label: `${i.distribution} ${i.name}`, value: i.id }))
)

const selected = ref<number | undefined>(props.droplet.image?.id)
const submitting = ref(false)

async function onConfirm() {
  if (!selected.value) return
  submitting.value = true
  await actions.rebuild(props.droplet, selected.value)
  submitting.value = false
  emit('close', true)
}
</script>

<template>
  <UModal
    title="Rebuild Droplet"
    :description="`Reinstall the operating system on ${droplet.name}.`"
    :close="{ onClick: () => emit('close') }"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <UAlert
          color="error"
          variant="subtle"
          icon="i-lucide-alert-triangle"
          title="This erases everything on the Droplet"
          description="Rebuilding wipes all data and reinstalls from the chosen image. This cannot be undone."
        />
        <UFormField
          label="Image"
          name="image"
        >
          <USelectMenu
            v-model="selected"
            :items="imageItems"
            value-key="value"
            label-key="label"
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
        label="Rebuild"
        color="error"
        :loading="submitting"
        @click="onConfirm"
      />
    </template>
  </UModal>
</template>
