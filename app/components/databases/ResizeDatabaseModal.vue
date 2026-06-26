<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'

/** Resize a cluster: pick node count + plan from the engine's available layouts. */
const props = defineProps<{ database: DatabaseCluster }>()
const emit = defineEmits<{ close: [done?: boolean] }>()

const actions = useDatabaseActions()
const { options, isPending } = useDatabaseOptions()

const layouts = computed(() => options.value[props.database.engine]?.layouts ?? [])

const numNodes = ref(props.database.num_nodes)
const size = ref(props.database.size)

// Node-count choices come from the engine's layouts (e.g. 1, 2, or 3 nodes).
const nodeItems = computed(() =>
  layouts.value.map(l => ({ label: `${l.num_nodes} node${l.num_nodes > 1 ? 's' : ''}`, value: l.num_nodes }))
)

// Plans available for the chosen node count.
const sizesForNodes = computed(() => layouts.value.find(l => l.num_nodes === numNodes.value)?.sizes ?? [])
const sizeItems = computed(() =>
  sizesForNodes.value.map((slug) => {
    const specs = databaseSizeSpecs(slug)
    return { label: specs ? `${slug} · ${specs}` : slug, value: slug }
  })
)

// If the new node count's layout doesn't offer the current plan, snap to its first plan.
watch(numNodes, () => {
  if (sizesForNodes.value.length && !sizesForNodes.value.includes(size.value)) {
    size.value = sizesForNodes.value[0]!
  }
})

const changed = computed(() => size.value !== props.database.size || numNodes.value !== props.database.num_nodes)
const submitting = ref(false)

async function onConfirm() {
  if (!changed.value) {
    emit('close')
    return
  }
  submitting.value = true
  const ok = await actions.resize(props.database, { size: size.value, num_nodes: numNodes.value })
  submitting.value = false
  if (ok) emit('close', true)
}
</script>

<template>
  <UModal
    title="Resize cluster"
    :description="`Change the plan or node count for ${database.name}.`"
    :close="{ onClick: () => emit('close') }"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-info"
          title="Resizing may briefly interrupt connections"
          description="The cluster reconfigures in place; storage can be scaled up but never back down."
        />

        <div
          v-if="isPending && !layouts.length"
          class="space-y-3"
        >
          <USkeleton class="h-9 w-full rounded-md" />
          <USkeleton class="h-9 w-full rounded-md" />
        </div>

        <template v-else>
          <UFormField
            label="Nodes"
            name="nodes"
            help="Additional nodes add standby replicas for high availability."
          >
            <USelect
              v-model="numNodes"
              :items="nodeItems"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Plan"
            name="size"
          >
            <USelectMenu
              v-model="size"
              :items="sizeItems"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
        </template>
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
        :disabled="!changed"
        @click="onConfirm"
      />
    </template>
  </UModal>
</template>
