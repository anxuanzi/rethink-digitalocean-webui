<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{ collapsed?: boolean }>()

const auth = useDoAuthStore()
const api = useDoApi()

// Cached account read for the footer (shared with the dashboard via the same query key).
// `enabled` keeps it client-only, since the token isn't available during SSR.
const { state } = useQuery({
  key: accountKeys.root,
  query: () => api.account.get(),
  enabled: () => auth.isConnected
})
const account = computed(() => state.value.data?.account)

const items = computed<DropdownMenuItem[][]>(() => [[
  {
    label: 'Disconnect',
    icon: 'i-lucide-log-out',
    color: 'error',
    onSelect: () => {
      auth.disconnect()
      navigateTo('/connect')
    }
  }
]])
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
        name="i-lucide-circle-user"
        class="size-5 shrink-0"
      />
      <span
        v-if="!collapsed"
        class="truncate text-left flex-1"
      >
        {{ account?.email ?? 'Account' }}
      </span>
    </UButton>
  </UDropdownMenu>
</template>
