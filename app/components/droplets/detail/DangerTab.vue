<script setup lang="ts">
import type { Droplet } from '~/types/droplet'

defineProps<{ droplet: Droplet }>()

const menu = useDropletMenu()
</script>

<template>
  <div class="rounded-lg border border-error/50 bg-error/5 divide-y divide-error/20">
    <div class="p-4 flex items-center gap-2">
      <UIcon
        name="i-lucide-triangle-alert"
        class="size-4 text-error"
      />
      <h3 class="font-semibold text-highlighted">
        Danger zone
      </h3>
    </div>

    <div class="p-4 flex flex-wrap items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm font-medium text-highlighted">
          Rebuild Droplet
        </p>
        <p class="text-sm text-muted max-w-md">
          Reinstall the Droplet from an image. <span class="text-highlighted">All data on the Droplet is erased</span> and replaced, but the IP address and ID are kept.
        </p>
      </div>
      <UButton
        label="Rebuild"
        icon="i-lucide-refresh-cw"
        color="error"
        variant="outline"
        @click="menu.openRebuild(droplet)"
      />
    </div>

    <div class="p-4 flex flex-wrap items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm font-medium text-highlighted">
          Destroy Droplet
        </p>
        <p class="text-sm text-muted max-w-md">
          Permanently delete this Droplet and its volumes. <span class="text-highlighted">This cannot be undone</span> — back up anything you need first.
        </p>
      </div>
      <UButton
        label="Destroy"
        icon="i-lucide-trash-2"
        color="error"
        variant="solid"
        @click="menu.openDestroy(droplet)"
      />
    </div>
  </div>
</template>
