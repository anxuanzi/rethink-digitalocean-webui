<script setup lang="ts">
useHead({ title: 'Teams' })

const store = useDoAuthStore()
const { switchTeam, removeTeam } = useDoAuth()

const addOpen = ref(false)

// --- Inline rename ---
const editingId = ref<string | null>(null)
const draftLabel = ref('')

function startRename(id: string, current: string) {
  editingId.value = id
  draftLabel.value = current
}
function saveRename() {
  if (editingId.value) store.renameToken(editingId.value, draftLabel.value)
  editingId.value = null
}

// --- Remove confirmation ---
const removeTarget = ref<string | null>(null)
const removeOpen = computed({
  get: () => removeTarget.value !== null,
  set: (value) => { if (!value) removeTarget.value = null }
})
const removeLabel = computed(() => store.tokens.find(t => t.id === removeTarget.value)?.label ?? '')

async function confirmRemove() {
  if (removeTarget.value) await removeTeam(removeTarget.value)
  removeTarget.value = null
}
</script>

<template>
  <div class="flex flex-col gap-4 w-full lg:max-w-2xl mx-auto">
    <div class="flex items-start justify-between gap-3">
      <p class="text-sm text-muted">
        Each team is backed by a DigitalOcean API token stored only in this browser. The active
        team is the one the console is currently managing.
      </p>
      <UButton
        icon="i-lucide-plus"
        label="Add team"
        size="sm"
        class="shrink-0"
        @click="addOpen = true"
      />
    </div>

    <div
      v-for="team in store.tokens"
      :key="team.id"
      class="bg-elevated/50 rounded-lg border border-default p-4 flex items-center gap-3"
    >
      <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <UIcon
          name="i-lucide-users"
          class="size-5 text-primary"
        />
      </div>

      <div class="min-w-0 flex-1">
        <div
          v-if="editingId === team.id"
          class="flex items-center gap-2"
        >
          <UInput
            v-model="draftLabel"
            size="sm"
            class="w-full"
            autofocus
            @keydown.enter="saveRename"
            @keydown.esc="editingId = null"
          />
          <UButton
            icon="i-lucide-check"
            size="sm"
            color="primary"
            variant="soft"
            aria-label="Save name"
            @click="saveRename"
          />
          <UButton
            icon="i-lucide-x"
            size="sm"
            color="neutral"
            variant="ghost"
            aria-label="Cancel rename"
            @click="editingId = null"
          />
        </div>

        <div
          v-else
          class="min-w-0"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-medium text-highlighted truncate">{{ team.label }}</span>
            <UBadge
              v-if="team.id === store.activeId"
              color="primary"
              variant="subtle"
              size="xs"
            >
              Active
            </UBadge>
          </div>
          <p class="text-sm text-muted truncate">
            {{ team.accountEmail }} · added {{ relativeTime(team.addedAt) }}
          </p>
        </div>
      </div>

      <div
        v-if="editingId !== team.id"
        class="flex items-center gap-1 shrink-0"
      >
        <UButton
          v-if="team.id !== store.activeId"
          label="Switch"
          size="sm"
          color="neutral"
          variant="outline"
          @click="switchTeam(team.id)"
        />
        <UButton
          icon="i-lucide-pencil"
          size="sm"
          color="neutral"
          variant="ghost"
          aria-label="Rename team"
          @click="startRename(team.id, team.label)"
        />
        <UButton
          icon="i-lucide-trash-2"
          size="sm"
          color="error"
          variant="ghost"
          aria-label="Remove team"
          @click="removeTarget = team.id"
        />
      </div>
    </div>

    <AddTeamModal v-model:open="addOpen" />

    <UModal
      v-model:open="removeOpen"
      title="Remove team"
      :description="`Remove ${removeLabel}? Its token is deleted from this browser. You can re-add it anytime with the token.`"
      :ui="{ footer: 'justify-end' }"
    >
      <template #footer="{ close }">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          @click="close"
        />
        <UButton
          label="Remove team"
          color="error"
          @click="confirmRemove"
        />
      </template>
    </UModal>
  </div>
</template>
