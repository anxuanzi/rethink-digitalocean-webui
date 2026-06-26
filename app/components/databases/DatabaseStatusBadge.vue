<script setup lang="ts">
import type { DatabaseStatus } from '~/types/database'

/** Cluster status as a subtle badge; transitional states (and in-flight actions) spin the icon. */
const props = defineProps<{ status: DatabaseStatus, busy?: boolean }>()

const meta = computed(() => databaseStatusMeta(props.status))
const spinning = computed(() => props.busy || meta.value.pulse)
</script>

<template>
  <UBadge
    :color="busy ? 'warning' : meta.color"
    variant="subtle"
    size="sm"
    class="gap-1"
  >
    <UIcon
      :name="busy ? 'i-lucide-loader' : meta.icon"
      class="size-3.5"
      :class="spinning ? 'animate-spin' : ''"
    />
    {{ busy ? 'Working' : meta.label }}
  </UBadge>
</template>
