<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{ collapsed?: boolean }>()

const store = useDoAuthStore()
const { switchTeam } = useDoAuth()

const addOpen = ref(false)

const items = computed<DropdownMenuItem[][]>(() => [
  // The connected teams — active one gets a check; selecting another switches.
  store.tokens.map(team => ({
    label: team.label,
    icon: team.id === store.activeId ? 'i-lucide-check' : 'i-lucide-circle',
    onSelect: () => switchTeam(team.id)
  })),
  [
    { label: 'Manage teams', icon: 'i-lucide-settings-2', to: '/settings/teams' },
    { label: 'Add team', icon: 'i-lucide-plus', onSelect: () => { addOpen.value = true } }
  ]
])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ side: 'top', align: 'start' }"
    class="w-full"
  >
    <UButton
      color="neutral"
      variant="ghost"
      block
      class="justify-start gap-2"
      :square="collapsed"
    >
      <UIcon
        name="i-lucide-users"
        class="size-5 shrink-0"
      />
      <span
        v-if="!collapsed"
        class="truncate text-left flex-1"
      >
        {{ store.activeToken?.label ?? 'Select team' }}
      </span>
      <UIcon
        v-if="!collapsed"
        name="i-lucide-chevrons-up-down"
        class="size-4 shrink-0 text-dimmed"
      />
    </UButton>
  </UDropdownMenu>

  <AddTeamModal v-model:open="addOpen" />
</template>
