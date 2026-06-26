<script setup lang="ts">
/**
 * The four headline metrics above the Droplets table: Total, Active, Off, and the running
 * monthly spend (summed from each Droplet's plan price). Reuses the tinted-icon-tile look
 * from the dashboard so the page feels native to the console. Numbers count up on load.
 */
const props = defineProps<{
  total: number
  active: number
  off: number
  monthlySpend: number
}>()

// Count-up: animate 0 → value on mount (and on change), unless the user prefers reduced motion.
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
const activeN = useCountUp(() => props.active)
const offN = useCountUp(() => props.off)
const spendN = useCountUp(() => props.monthlySpend, 650)

const stats = computed(() => [
  {
    key: 'total',
    label: 'Total',
    value: totalN.value.toLocaleString(),
    icon: 'i-lucide-server',
    tint: 'text-primary bg-primary/10'
  },
  {
    key: 'active',
    label: 'Active',
    value: activeN.value.toLocaleString(),
    icon: 'i-lucide-circle-check',
    tint: 'text-success bg-success/10'
  },
  {
    key: 'off',
    label: 'Off',
    value: offN.value.toLocaleString(),
    icon: 'i-lucide-circle-stop',
    tint: 'text-muted bg-elevated'
  },
  {
    key: 'spend',
    label: 'Monthly spend',
    value: `$${spendN.value.toLocaleString()}/mo`,
    icon: 'i-lucide-wallet',
    tint: 'text-warning bg-warning/10'
  }
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
