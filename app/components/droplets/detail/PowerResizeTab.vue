<script setup lang="ts">
import type { Droplet } from '~/types/droplet'

const props = defineProps<{ droplet: Droplet }>()

const actions = useDropletActions()
const menu = useDropletMenu()

const busy = computed(() => actions.isBusy(props.droplet.id))
const isOff = computed(() => props.droplet.status === 'off')
</script>

<template>
  <div class="space-y-6">
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-power"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Power
          </h3>
        </div>
      </template>

      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-medium text-highlighted">
              {{ isOff ? 'Power on' : 'Power off' }}
            </p>
            <p class="text-sm text-muted">
              {{ isOff
                ? 'Boot the Droplet back up.'
                : 'A hard power off, like pulling the plug. Prefer shutting down from inside the OS when you can.' }}
            </p>
          </div>
          <UButton
            v-if="isOff"
            label="Power on"
            icon="i-lucide-power"
            color="primary"
            :loading="busy"
            @click="actions.powerOn(droplet)"
          />
          <UButton
            v-else
            label="Power off"
            icon="i-lucide-power-off"
            color="neutral"
            variant="outline"
            :loading="busy"
            @click="actions.powerOff(droplet)"
          />
        </div>

        <USeparator />

        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-medium text-highlighted">
              Reboot
            </p>
            <p class="text-sm text-muted">
              Gracefully restart the Droplet's operating system.
            </p>
          </div>
          <UButton
            label="Reboot"
            icon="i-lucide-rotate-cw"
            color="neutral"
            variant="outline"
            :loading="busy"
            :disabled="isOff"
            @click="actions.reboot(droplet)"
          />
        </div>

        <USeparator />

        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-medium text-highlighted">
              Power cycle
            </p>
            <p class="text-sm text-muted">
              A hard power off followed by a power on. Use when the Droplet is unresponsive.
            </p>
          </div>
          <UButton
            label="Power cycle"
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            :loading="busy"
            @click="actions.powerCycle(droplet)"
          />
        </div>
      </div>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-scaling"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Resize
          </h3>
        </div>
      </template>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-medium text-highlighted">
            Change plan
          </p>
          <p class="text-sm text-muted max-w-md">
            Scale CPU and RAM up or down. The Droplet is powered off during a resize. CPU/RAM-only changes are reversible; resizing the disk is permanent.
          </p>
        </div>
        <UButton
          label="Resize"
          icon="i-lucide-scaling"
          color="primary"
          variant="solid"
          :disabled="busy"
          @click="menu.openResize(droplet)"
        />
      </div>
    </UCard>
  </div>
</template>
