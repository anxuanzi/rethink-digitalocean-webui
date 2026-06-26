<script setup lang="ts">
import type { DropletStatus } from '~/types/droplet'

const props = defineProps<{ status: DropletStatus, busy?: boolean }>()

const meta = computed(() => dropletStatusMeta(props.status))
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
