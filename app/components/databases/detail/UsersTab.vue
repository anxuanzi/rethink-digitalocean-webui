<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { DatabaseCluster, DatabaseUser } from '~/types/database'
import CreateDatabaseUserModal from '~/components/databases/CreateDatabaseUserModal.vue'

const props = defineProps<{ database: DatabaseCluster }>()

const actions = useDatabaseActions()
const overlay = useOverlay()
const createModal = overlay.create(CreateDatabaseUserModal)

// Read from the dedicated endpoint — the cluster object omits users for some engines (MongoDB).
const { users, isPending: usersLoading } = useDatabaseUsers(() => props.database.id)
const busy = computed(() => actions.isBusy(props.database.id))

// The cluster's primary/admin user (`doadmin`) can't be deleted — only its password reset.
function isDefault(user: DatabaseUser) {
  return user.name === 'doadmin' || user.role === 'primary' || user.name === props.database.connection?.user
}

// PostgreSQL/MySQL put the role at the top level; MongoDB nests it under settings.
function displayRole(user: DatabaseUser) {
  return user.role ?? user.settings?.mongo_user_settings?.role
}

// One confirm modal serves both reset-password and delete (both are impactful on a live DB).
const pending = ref<{ kind: 'delete' | 'reset', user: DatabaseUser } | null>(null)
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
  const { kind, user } = pending.value
  const ok = kind === 'delete'
    ? await actions.removeUser(props.database, user.name)
    : await actions.resetUserAuth(props.database, user.name)
  submitting.value = false
  if (ok) pending.value = null
}

function setPending(kind: 'delete' | 'reset', user: DatabaseUser) {
  pending.value = { kind, user }
}

function rowMenu(user: DatabaseUser): DropdownMenuItem[][] {
  const items: DropdownMenuItem[][] = [
    [{ label: 'Reset password', icon: 'i-lucide-key-round', onSelect: () => setPending('reset', user) }]
  ]
  if (!isDefault(user)) {
    items.push([{ label: 'Delete user', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => setPending('delete', user) }])
  }
  return items
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
            name="i-lucide-users"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Users
          </h3>
          <UBadge
            v-if="!usersLoading"
            color="neutral"
            variant="subtle"
            size="xs"
          >
            {{ users.length }}
          </UBadge>
        </div>
        <UButton
          label="Create user"
          icon="i-lucide-plus"
          size="sm"
          @click="openCreate"
        />
      </div>
    </template>

    <!-- Loading -->
    <div
      v-if="usersLoading && !users.length"
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
      v-else-if="users.length"
      class="divide-y divide-default"
    >
      <li
        v-for="user in users"
        :key="user.name"
        class="flex items-center gap-3 px-4 py-3 sm:px-5"
      >
        <div class="size-8 rounded-lg bg-elevated flex items-center justify-center shrink-0">
          <UIcon
            name="i-lucide-user"
            class="size-4 text-muted"
          />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="font-medium text-highlighted truncate font-mono text-sm">{{ user.name }}</span>
            <UBadge
              v-if="isDefault(user)"
              color="primary"
              variant="subtle"
              size="xs"
            >
              Default
            </UBadge>
            <UBadge
              v-else-if="displayRole(user)"
              color="neutral"
              variant="subtle"
              size="xs"
            >
              {{ displayRole(user) }}
            </UBadge>
          </div>
        </div>

        <DatabaseSecretValue
          v-if="user.password"
          :value="user.password"
          label="Password"
        />
        <span
          v-else
          class="text-sm text-dimmed"
        >—</span>

        <UDropdownMenu
          :items="rowMenu(user)"
          :content="{ align: 'end' }"
        >
          <UButton
            icon="i-lucide-ellipsis-vertical"
            color="neutral"
            variant="ghost"
            size="sm"
            :aria-label="`Actions for ${user.name}`"
          />
        </UDropdownMenu>
      </li>
    </ul>

    <div
      v-else
      class="px-6 py-10 text-center text-sm text-muted"
    >
      No users found for this cluster.
    </div>
  </UCard>

  <!-- Confirm reset / delete -->
  <UModal
    v-model:open="confirmOpen"
    :title="pending?.kind === 'delete' ? 'Delete user' : 'Reset password'"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <UAlert
        v-if="pending?.kind === 'delete'"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        :title="`Delete “${pending?.user.name}”?`"
        description="Any application connecting as this user will immediately lose access. This cannot be undone."
      />
      <UAlert
        v-else
        color="warning"
        variant="subtle"
        icon="i-lucide-key-round"
        :title="`Reset the password for “${pending?.user.name}”?`"
        description="A new password is generated. Anything using the current password will need updating."
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
        :label="pending?.kind === 'delete' ? 'Delete user' : 'Reset password'"
        :color="pending?.kind === 'delete' ? 'error' : 'primary'"
        :loading="submitting || busy"
        @click="confirmAction"
      />
    </template>
  </UModal>
</template>
