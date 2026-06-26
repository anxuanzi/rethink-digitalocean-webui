<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'
import CreateDatabaseDbModal from '~/components/databases/CreateDatabaseDbModal.vue'

const props = defineProps<{ database: DatabaseCluster }>()

const actions = useDatabaseActions()
const overlay = useOverlay()
const createModal = overlay.create(CreateDatabaseDbModal)

// Logical databases are a concept for relational/document engines; Redis/Valkey/Kafka/OpenSearch
// organize data differently (numbered DBs, topics, indexes), so we don't manage them here.
const supportsDbs = computed(() => ['pg', 'mysql', 'mongodb'].includes(props.database.engine))

// Read from the dedicated endpoint — the cluster object omits db_names for some engines (MongoDB).
const { dbs: dbList, isPending: dbsLoading } = useDatabaseDbs(() => props.database.id)
const dbs = computed(() => dbList.value.map(d => d.name))

// Default databases (`defaultdb` on PG/MySQL, `admin` on MongoDB) can't be removed.
function isDefault(name: string) {
  return name === 'defaultdb' || name === 'admin' || name === props.database.connection?.database
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
  const ok = await actions.removeDb(props.database, pendingDelete.value)
  submitting.value = false
  if (ok) pendingDelete.value = null
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
            name="i-lucide-table-2"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Databases
          </h3>
          <UBadge
            v-if="supportsDbs && !dbsLoading"
            color="neutral"
            variant="subtle"
            size="xs"
          >
            {{ dbs.length }}
          </UBadge>
        </div>
        <UButton
          v-if="supportsDbs"
          label="Create database"
          icon="i-lucide-plus"
          size="sm"
          @click="openCreate"
        />
      </div>
    </template>

    <!-- Engines without logical databases -->
    <div
      v-if="!supportsDbs"
      class="px-6 py-10 text-center"
    >
      <p class="text-sm text-muted max-w-sm mx-auto">
        {{ engineMeta(database.engine).label }} doesn't use logical databases. Data is organized by
        keys, topics, or indexes instead.
      </p>
    </div>

    <!-- Loading -->
    <div
      v-else-if="dbsLoading && !dbs.length"
      class="divide-y divide-default"
    >
      <div
        v-for="i in 2"
        :key="i"
        class="flex items-center gap-3 px-4 py-3 sm:px-5"
      >
        <USkeleton class="size-8 rounded-lg" />
        <USkeleton class="h-4 w-40 flex-1" />
      </div>
    </div>

    <ul
      v-else-if="dbs.length"
      class="divide-y divide-default"
    >
      <li
        v-for="name in dbs"
        :key="name"
        class="flex items-center gap-3 px-4 py-3 sm:px-5"
      >
        <div class="size-8 rounded-lg bg-elevated flex items-center justify-center shrink-0">
          <UIcon
            name="i-lucide-table-2"
            class="size-4 text-muted"
          />
        </div>
        <span class="font-mono text-sm text-highlighted truncate flex-1">{{ name }}</span>
        <UBadge
          v-if="isDefault(name)"
          color="neutral"
          variant="subtle"
          size="xs"
        >
          Default
        </UBadge>
        <UButton
          v-else
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="sm"
          :aria-label="`Delete database ${name}`"
          @click="pendingDelete = name"
        />
      </li>
    </ul>

    <div
      v-else
      class="px-6 py-10 text-center text-sm text-muted"
    >
      No databases yet. Create one to get started.
    </div>
  </UCard>

  <!-- Confirm delete -->
  <UModal
    v-model:open="confirmOpen"
    title="Delete database"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <UAlert
        color="error"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        :title="`Delete “${pendingDelete}”?`"
        description="Every table and row in this database will be permanently removed. This cannot be undone."
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
        label="Delete database"
        color="error"
        :loading="submitting"
        @click="confirmDelete"
      />
    </template>
  </UModal>
</template>
