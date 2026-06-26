<script setup lang="ts">
import type { DatabaseEngine } from '~/types/database'

/** Tinted tile with the engine's brand logo — used on cards, the detail header, and the wizard. */
const props = withDefaults(defineProps<{ engine: DatabaseEngine | string, size?: 'sm' | 'md' | 'lg' }>(), {
  size: 'md'
})

const meta = computed(() => engineMeta(props.engine))
const tileClass = computed(() => ({ sm: 'size-8', md: 'size-10', lg: 'size-12' }[props.size]))
const iconClass = computed(() => ({ sm: 'size-4', md: 'size-5', lg: 'size-6' }[props.size]))
</script>

<template>
  <div
    class="rounded-lg flex items-center justify-center shrink-0"
    :class="[tileClass, meta.tint]"
  >
    <UIcon
      :name="meta.icon"
      :class="iconClass"
    />
  </div>
</template>
