<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'
import CreateDatabasePoolModal from '~/components/databases/CreateDatabasePoolModal.vue'

const props = defineProps<{ database: DatabaseCluster }>()

const { pools, isPending } = useDatabasePools(() => props.database.id)

const actions = useDatabaseActions()
const overlay = useOverlay()
const createModal = overlay.create(CreateDatabasePoolModal)

function openCreate() {
  createModal.open({ database: props.database })
}

const pendingDelete = ref<string | null>(null)
const confirmOpen = computed({
  get: () => !!pendingDelete.value,
  set: (value) => {
    if (!value) pendingDelete.value = null
  }
})
const submitting = ref(false)

async function confirmDelete() {
  if (!pendingDelete.value) return
  submitting.value = true
  const ok = await actions.removePool(props.database, pendingDelete.value)
  submitting.value = false
  if (ok) pendingDelete.value = null
}
</script>

<template>
  <UCard
    variant="subtle"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-waypoints"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Connection pools
          </h3>
          <UBadge
            v-if="!isPending"
            color="neutral"
            variant="subtle"
            size="xs"
          >
            {{ pools.length }}
          </UBadge>
        </div>
        <UButton
          label="Create pool"
          icon="i-lucide-plus"
          size="sm"
          @click="openCreate"
        />
      </div>
    </template>

    <!-- Loading -->
    <div
      v-if="isPending && !pools.length"
      class="divide-y divide-default"
    >
      <div
        v-for="i in 2"
        :key="i"
        class="flex items-center gap-3 px-4 py-3 sm:px-5"
      >
        <USkeleton class="h-4 w-40 flex-1" />
      </div>
    </div>

    <ul
      v-else-if="pools.length"
      class="divide-y divide-default"
    >
      <li
        v-for="pool in pools"
        :key="pool.name"
        class="flex items-center gap-3 px-4 py-3 sm:px-5"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm text-highlighted truncate">{{ pool.name }}</span>
            <UBadge
              color="neutral"
              variant="subtle"
              size="xs"
            >
              {{ pool.mode }}
            </UBadge>
          </div>
          <p class="text-muted text-xs mt-0.5 truncate">
            {{ pool.size }} connections · {{ pool.db }} · {{ pool.user }}
          </p>
        </div>
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="sm"
          :aria-label="`Delete pool ${pool.name}`"
          @click="pendingDelete = pool.name"
        />
      </li>
    </ul>

    <div
      v-else
      class="px-6 py-10 text-center"
    >
      <UIcon
        name="i-lucide-waypoints"
        class="size-8 text-dimmed mx-auto"
      />
      <p class="text-sm text-highlighted font-medium mt-3">
        No connection pools
      </p>
      <p class="text-sm text-muted max-w-sm mx-auto mt-1">
        PgBouncer pools let many clients share a fixed set of database connections — essential for
        serverless and high-concurrency apps.
      </p>
    </div>
  </UCard>

  <!-- Confirm delete -->
  <UModal
    v-model:open="confirmOpen"
    title="Delete connection pool"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <UAlert
        color="error"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        :title="`Delete “${pendingDelete}”?`"
        description="Clients using this pool will lose their pooled connection. This cannot be undone."
      />
    </template>
    <template #footer>
      <UButton
        label="Cancel"
        color="neutral"
        variant="ghost"
        @click="confirmOpen = false"
      />
      <UButton
        label="Delete pool"
        color="error"
        :loading="submitting"
        @click="confirmDelete"
      />
    </template>
  </UModal>
</template>
