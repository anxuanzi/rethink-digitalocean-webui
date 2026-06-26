<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { DatabaseCluster, DatabaseReplica } from '~/types/database'
import CreateDatabaseReplicaModal from '~/components/databases/CreateDatabaseReplicaModal.vue'

const props = defineProps<{ database: DatabaseCluster }>()

const actions = useDatabaseActions()
const overlay = useOverlay()
const createModal = overlay.create(CreateDatabaseReplicaModal)

const { replicas, isPending } = useDatabaseReplicas(() => props.database.id)

// One confirm modal serves both promote and delete (both are impactful on a live cluster).
const pending = ref<{ kind: 'promote' | 'delete', replica: DatabaseReplica } | null>(null)
const confirmOpen = computed({
  get: () => !!pending.value,
  set: (value) => {
    if (!value) pending.value = null
  }
})
const submitting = ref(false)

async function confirmAction() {
  if (!pending.value) return
  submitting.value = true
  const { kind, replica } = pending.value
  const ok = kind === 'promote'
    ? await actions.promoteReplica(props.database, replica.name)
    : await actions.removeReplica(props.database, replica.name)
  submitting.value = false
  if (ok) pending.value = null
}

function setPending(kind: 'promote' | 'delete', replica: DatabaseReplica) {
  pending.value = { kind, replica }
}

function rowMenu(replica: DatabaseReplica): DropdownMenuItem[][] {
  return [
    [{ label: 'Promote to primary', icon: 'i-lucide-arrow-up-circle', onSelect: () => setPending('promote', replica) }],
    [{ label: 'Delete replica', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => setPending('delete', replica) }]
  ]
}

function openCreate() {
  createModal.open({ database: props.database })
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
            name="i-lucide-git-fork"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Read-only replicas
          </h3>
          <UBadge
            v-if="!isPending"
            color="neutral"
            variant="subtle"
            size="xs"
          >
            {{ replicas.length }}
          </UBadge>
        </div>
        <UButton
          label="Create replica"
          icon="i-lucide-plus"
          size="sm"
          @click="openCreate"
        />
      </div>
    </template>

    <!-- Loading -->
    <div
      v-if="isPending && !replicas.length"
      class="divide-y divide-default"
    >
      <div
        v-for="i in 2"
        :key="i"
        class="flex items-center gap-3 px-4 py-3 sm:px-5"
      >
        <USkeleton class="size-8 rounded-lg" />
        <USkeleton class="h-4 w-40 flex-1" />
        <USkeleton class="h-6 w-16 rounded-full" />
      </div>
    </div>

    <ul
      v-else-if="replicas.length"
      class="divide-y divide-default"
    >
      <li
        v-for="replica in replicas"
        :key="replica.name"
        class="flex items-center gap-3 px-4 py-3 sm:px-5"
      >
        <div class="size-8 rounded-lg bg-elevated flex items-center justify-center shrink-0">
          <UIcon
            name="i-lucide-git-fork"
            class="size-4 text-muted"
          />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm text-highlighted truncate">{{ replica.name }}</span>
            <DatabaseStatusBadge :status="replica.status" />
          </div>
          <p class="text-muted text-xs mt-0.5 truncate">
            {{ regionName(replica.region) }} · {{ relativeTime(replica.created_at) }}
          </p>
        </div>

        <UDropdownMenu
          :items="rowMenu(replica)"
          :content="{ align: 'end' }"
        >
          <UButton
            icon="i-lucide-ellipsis-vertical"
            color="neutral"
            variant="ghost"
            size="sm"
            :aria-label="`Actions for ${replica.name}`"
          />
        </UDropdownMenu>
      </li>
    </ul>

    <div
      v-else
      class="px-6 py-12 text-center"
    >
      <UIcon
        name="i-lucide-git-fork"
        class="size-8 text-dimmed mx-auto"
      />
      <p class="mt-3 text-sm font-medium text-highlighted">
        No replicas
      </p>
      <p class="mt-1 text-sm text-muted">
        Add a read-only replica to scale reads or keep a warm standby in another region.
      </p>
    </div>
  </UCard>

  <!-- Confirm promote / delete -->
  <UModal
    v-model:open="confirmOpen"
    :title="pending?.kind === 'delete' ? 'Delete replica' : 'Promote replica'"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <UAlert
        v-if="pending?.kind === 'delete'"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        :title="`Delete “${pending?.replica.name}”?`"
        description="This removes the read replica. This cannot be undone."
      />
      <UAlert
        v-else
        color="warning"
        variant="subtle"
        icon="i-lucide-arrow-up-circle"
        :title="`Promote “${pending?.replica.name}” to a standalone primary?`"
        description="It will detach from this cluster."
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
        :label="pending?.kind === 'delete' ? 'Delete replica' : 'Promote replica'"
        :color="pending?.kind === 'delete' ? 'error' : 'primary'"
        :loading="submitting"
        @click="confirmAction"
      />
    </template>
  </UModal>
</template>
