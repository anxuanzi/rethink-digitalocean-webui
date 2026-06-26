<script setup lang="ts">
import type { Droplet } from '~/types/droplet'

const props = defineProps<{ droplet: Droplet }>()

const actions = useDropletActions()
const menu = useDropletMenu()

const busy = computed(() => actions.isBusy(props.droplet.id))
const backupsOn = computed(() => props.droplet.features.includes('backups'))
const backupCount = computed(() => props.droplet.backup_ids.length)
const snapshotCount = computed(() => props.droplet.snapshot_ids.length)
</script>

<template>
  <div class="space-y-6">
    <!-- Automated backups -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-shield-check"
              class="size-4 text-muted"
            />
            <h3 class="font-semibold text-highlighted">
              Automated backups
            </h3>
          </div>
          <UBadge
            :color="backupsOn ? 'success' : 'neutral'"
            variant="subtle"
            size="sm"
          >
            {{ backupsOn ? 'Enabled' : 'Disabled' }}
          </UBadge>
        </div>
      </template>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm text-muted max-w-md">
            DigitalOcean automatically backs up this Droplet on a weekly schedule. Backups add 20% to the
            Droplet's monthly cost and let you restore to a previous state.
          </p>
          <p
            v-if="backupsOn"
            class="text-sm text-dimmed mt-1"
          >
            {{ backupCount }} backup{{ backupCount === 1 ? '' : 's' }} stored
          </p>
        </div>
        <UButton
          v-if="backupsOn"
          label="Disable backups"
          icon="i-lucide-shield-off"
          color="neutral"
          variant="outline"
          :loading="busy"
          @click="actions.disableBackups(droplet)"
        />
        <UButton
          v-else
          label="Enable backups"
          icon="i-lucide-shield-check"
          color="primary"
          :loading="busy"
          @click="actions.enableBackups(droplet)"
        />
      </div>
    </UCard>

    <!-- Snapshots -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-camera"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Snapshots
          </h3>
        </div>
      </template>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm text-muted max-w-md">
            A snapshot is an on-demand copy of the Droplet you can use to create new Droplets or restore this one.
            Taking a snapshot may briefly power off the Droplet.
          </p>
          <p class="text-sm text-dimmed mt-1">
            {{ snapshotCount }} snapshot{{ snapshotCount === 1 ? '' : 's' }} stored
          </p>
        </div>
        <UButton
          label="Take snapshot"
          icon="i-lucide-camera"
          color="primary"
          variant="solid"
          :disabled="busy"
          @click="menu.openSnapshot(droplet)"
        />
      </div>
    </UCard>

    <!-- Storage summary -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-elevated/50 rounded-lg border border-default p-4">
        <p class="text-2xl font-semibold text-highlighted tabular-nums">
          {{ backupCount }}
        </p>
        <p class="text-sm text-muted">
          Backups
        </p>
      </div>
      <div class="bg-elevated/50 rounded-lg border border-default p-4">
        <p class="text-2xl font-semibold text-highlighted tabular-nums">
          {{ snapshotCount }}
        </p>
        <p class="text-sm text-muted">
          Snapshots
        </p>
      </div>
    </div>
  </div>
</template>
