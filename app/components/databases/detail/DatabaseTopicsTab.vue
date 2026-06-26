<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'
import CreateDatabaseTopicModal from '~/components/databases/CreateDatabaseTopicModal.vue'

const props = defineProps<{ database: DatabaseCluster }>()

const actions = useDatabaseActions()
const overlay = useOverlay()
const createModal = overlay.create(CreateDatabaseTopicModal)

const { topics, isPending } = useDatabaseTopics(() => props.database.id)

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
  const ok = await actions.removeTopic(props.database, pendingDelete.value)
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
            name="i-lucide-list"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Topics
          </h3>
          <UBadge
            v-if="!isPending"
            color="neutral"
            variant="subtle"
            size="xs"
          >
            {{ topics.length }}
          </UBadge>
        </div>
        <UButton
          label="Create topic"
          icon="i-lucide-plus"
          size="sm"
          @click="openCreate"
        />
      </div>
    </template>

    <!-- Loading -->
    <div
      v-if="isPending && !topics.length"
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
      v-else-if="topics.length"
      class="divide-y divide-default"
    >
      <li
        v-for="topic in topics"
        :key="topic.name"
        class="flex items-center gap-3 px-4 py-3 sm:px-5"
      >
        <div class="size-8 rounded-lg bg-elevated flex items-center justify-center shrink-0">
          <UIcon
            name="i-lucide-list"
            class="size-4 text-muted"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-mono text-sm text-highlighted truncate">
            {{ topic.name }}
          </p>
          <p class="text-muted text-xs">
            {{ topic.partition_count ?? '—' }} partitions · RF {{ topic.replication_factor ?? '—' }}
          </p>
        </div>
        <UBadge
          v-if="topic.state"
          color="neutral"
          variant="subtle"
          size="xs"
        >
          {{ topic.state }}
        </UBadge>
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="sm"
          :aria-label="`Delete topic ${topic.name}`"
          @click="pendingDelete = topic.name"
        />
      </li>
    </ul>

    <div
      v-else
      class="px-6 py-10 text-center text-sm text-muted"
    >
      No topics
    </div>
  </UCard>

  <!-- Confirm delete -->
  <UModal
    v-model:open="confirmOpen"
    title="Delete topic"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <UAlert
        color="error"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        :title="`Delete “${pendingDelete}”?`"
        description="Every message in this topic will be permanently removed. This cannot be undone."
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
        label="Delete topic"
        color="error"
        :loading="submitting"
        @click="confirmDelete"
      />
    </template>
  </UModal>
</template>
