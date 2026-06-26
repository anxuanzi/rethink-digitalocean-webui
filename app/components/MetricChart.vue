<script setup lang="ts">
import { CurveType, LegendPosition } from 'vue-chrts'
import type { ChartPoint } from '~/composables/useDropletMetrics'

const props = defineProps<{
  data: ChartPoint[]
  categories: Record<string, { name: string, color: string }>
  height?: number
  loading?: boolean
  yFormat?: (v: number) => string
}>()

const h = computed(() => props.height ?? 220)

// nuxt-charts formats the x-axis from data indices — map index → time label.
function xFormatter(i: number) {
  const point = props.data[i]
  return point ? new Date(point.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
}
function yFormatter(v: number) {
  return props.yFormat ? props.yFormat(v) : String(Math.round(v))
}
</script>

<template>
  <div :style="{ height: `${h}px` }">
    <div
      v-if="loading"
      class="size-full flex items-center justify-center"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-5 animate-spin text-muted"
      />
    </div>
    <AreaChart
      v-else-if="data.length"
      :data="data"
      :height="h"
      :categories="categories"
      :x-formatter="xFormatter"
      :y-formatter="yFormatter"
      :curve-type="CurveType.MonotoneX"
      :legend-position="LegendPosition.TopRight"
      :x-num-ticks="5"
      :y-num-ticks="4"
    />
    <div
      v-else
      class="size-full flex items-center justify-center text-center text-sm text-muted border border-dashed border-default rounded-lg p-4"
    >
      No metrics yet — install the DigitalOcean monitoring agent on this Droplet to see graphs.
    </div>
  </div>
</template>
