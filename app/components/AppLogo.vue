<script setup lang="ts">
defineProps<{ collapsed?: boolean }>()
</script>

<template>
  <div class="flex items-center gap-2 px-1 py-1.5">
    <UIcon
      name="i-simple-icons-digitalocean"
      class="size-6 text-primary shrink-0"
    />
    <span
      v-if="!collapsed"
      class="font-semibold text-highlighted truncate"
    >
      DO Console
    </span>
  </div>
</template>
