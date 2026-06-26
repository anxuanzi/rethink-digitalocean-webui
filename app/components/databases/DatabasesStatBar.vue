<script setup lang="ts">
/**
 * Headline metrics above the Databases grid: clusters, online, total nodes, provisioned storage.
 * Numbers count up on load (respecting reduced-motion), matching the Droplets stat bar.
 */
const props = defineProps<{
  total: number
  online: number
  nodes: number
  storageMib: number
}>()

const reduce = usePreferredReducedMotion()

function useCountUp(source: () => number, duration = 500) {
  if (reduce.value === 'reduce') return computed(() => Math.round(source()))
  const src = ref(0)
  const tweened = useTransition(src, { duration, transition: [0.25, 0.1, 0.25, 1] })
  onMounted(() => {
    src.value = source()
  })
  watch(source, (value) => {
    src.value = value
  })
  return computed(() => Math.round(tweened.value))
}

const totalN = useCountUp(() => props.total)
const onlineN = useCountUp(() => props.online)
const nodesN = useCountUp(() => props.nodes)
const storage = computed(() => formatStorage(props.storageMib))

const stats = computed(() => [
  { key: 'total', label: 'Clusters', value: totalN.value.toLocaleString(), icon: 'i-lucide-database', tint: 'text-primary bg-primary/10' },
  { key: 'online', label: 'Online', value: onlineN.value.toLocaleString(), icon: 'i-lucide-circle-check', tint: 'text-success bg-success/10' },
  { key: 'nodes', label: 'Nodes', value: nodesN.value.toLocaleString(), icon: 'i-lucide-layers', tint: 'text-info bg-info/10' },
  { key: 'storage', label: 'Storage', value: storage.value, icon: 'i-lucide-hard-drive', tint: 'text-warning bg-warning/10' }
])
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div
      v-for="(stat, i) in stats"
      :key="stat.key"
      class="animate-rise bg-elevated/50 rounded-lg border border-default p-4 flex items-center gap-3 transition-colors hover:border-default/80 hover:bg-elevated"
      :style="{ animationDelay: `${i * 60}ms` }"
    >
      <div
        class="size-10 rounded-lg flex items-center justify-center shrink-0"
        :class="stat.tint"
      >
        <UIcon
          :name="stat.icon"
          class="size-5"
        />
      </div>
      <div class="min-w-0">
        <p class="text-xs text-muted uppercase tracking-wide">
          {{ stat.label }}
        </p>
        <p class="text-xl font-semibold text-highlighted tabular-nums truncate">
          {{ stat.value }}
        </p>
      </div>
    </div>
  </div>
</template>
