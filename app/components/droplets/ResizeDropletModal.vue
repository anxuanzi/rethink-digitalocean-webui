<script setup lang="ts">
import type { Droplet } from '~/types/droplet'

const props = defineProps<{ droplet: Droplet }>()
const emit = defineEmits<{ close: [done?: boolean] }>()

const api = useDoApi()
const auth = useDoAuthStore()
const actions = useDropletActions()

const { state } = useQuery({
  key: () => lookupKeys.sizes(auth.activeId),
  query: () => api.sizes.list(),
  enabled: () => auth.isConnected
})

const sizeItems = computed(() =>
  (state.value.data?.sizes ?? [])
    .filter(s => s.available && s.regions.includes(props.droplet.region.slug))
    .map(s => ({
      label: `${s.slug} · ${formatMemory(s.memory)} · ${s.vcpus} vCPU · ${formatDisk(s.disk)} · $${s.price_monthly}/mo`,
      value: s.slug
    }))
)

const selected = ref(props.droplet.size_slug)
const resizeDisk = ref(false)
const submitting = ref(false)

async function onConfirm() {
  if (selected.value === props.droplet.size_slug && !resizeDisk.value) {
    emit('close')
    return
  }
  submitting.value = true
  await actions.resize(props.droplet, selected.value, resizeDisk.value)
  submitting.value = false
  emit('close', true)
}
</script>

<template>
  <UModal
    title="Resize Droplet"
    :description="`Change the plan for ${droplet.name}.`"
    :close="{ onClick: () => emit('close') }"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-power-off"
          title="The Droplet will be powered off to resize"
          description="CPU/RAM-only changes are reversible. Resizing the disk is permanent — you can't scale it back down."
        />
        <UFormField
          label="New plan"
          name="size"
        >
          <USelectMenu
            v-model="selected"
            :items="sizeItems"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>
        <UCheckbox
          v-model="resizeDisk"
          label="Also resize the disk (permanent)"
        />
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
        label="Resize"
        :loading="submitting"
        @click="onConfirm"
      />
    </template>
  </UModal>
</template>
