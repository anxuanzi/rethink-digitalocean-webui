<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'

/** One cluster in the list grid: engine identity, status, region, and capacity at a glance. */
const props = defineProps<{ database: DatabaseCluster }>()

const actions = useDatabaseActions()
const { menuItems } = useDatabaseMenu()

const meta = computed(() => engineMeta(props.database.engine))
const specs = computed(() => databaseSizeSpecs(props.database.size))
const busy = computed(() => actions.isBusy(props.database.id))

function open() {
  navigateTo(`/database/${props.database.id}`)
}
</script>

<template>
  <div
    class="group relative rounded-xl border border-default bg-elevated/50 p-4 cursor-pointer transition-all hover:border-primary/50 hover:bg-elevated hover:-translate-y-0.5"
    @click="open"
  >
    <div class="flex items-start gap-3">
      <DatabaseEngineIcon :engine="database.engine" />

      <div class="min-w-0 flex-1">
        <h3 class="font-semibold text-highlighted truncate">
          {{ database.name }}
        </h3>
        <p class="text-sm text-muted truncate">
          {{ meta.label }} {{ database.version }}
        </p>
      </div>

      <!-- Stop propagation so the menu doesn't trigger row navigation -->
      <div @click.stop>
        <UDropdownMenu
          :items="menuItems(database)"
          :content="{ align: 'end' }"
        >
          <UButton
            icon="i-lucide-ellipsis-vertical"
            color="neutral"
            variant="ghost"
            size="sm"
            :aria-label="`Actions for ${database.name}`"
          />
        </UDropdownMenu>
      </div>
    </div>

    <div class="mt-3 flex items-center justify-between gap-2">
      <DatabaseStatusBadge
        :status="database.status"
        :busy="busy"
      />
      <span class="inline-flex items-center gap-1 text-xs text-muted">
        <UIcon
          name="i-lucide-map-pin"
          class="size-3.5"
        />
        {{ regionName(database.region) }}
      </span>
    </div>

    <div class="mt-3 pt-3 border-t border-default flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      <span class="inline-flex items-center gap-1">
        <UIcon
          name="i-lucide-layers"
          class="size-3.5"
        />
        {{ database.num_nodes }} node{{ database.num_nodes > 1 ? 's' : '' }}
      </span>
      <span
        v-if="specs"
        class="inline-flex items-center gap-1"
      >
        <UIcon
          name="i-lucide-cpu"
          class="size-3.5"
        />
        {{ specs }}
      </span>
      <span class="inline-flex items-center gap-1">
        <UIcon
          name="i-lucide-hard-drive"
          class="size-3.5"
        />
        {{ formatStorage(database.storage_size_mib) }}
      </span>
    </div>
  </div>
</template>
