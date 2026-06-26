<script setup lang="ts">
/**
 * Dashboard hero: a time-aware greeting, the active team/account, account health, and how many
 * Droplets are in use against the account's limit — with a quick "Create Droplet" action.
 */
const props = defineProps<{ dropletCount: number }>()

const store = useDoAuthStore()
const { account } = useAccount()

const team = computed(() => store.activeToken?.label ?? 'your account')
const email = computed(() => account.value?.email || store.activeToken?.accountEmail || '')

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

const statusMeta = computed(() => {
  switch (account.value?.status) {
    case 'active': return { label: 'Account active', color: 'success', icon: 'i-lucide-circle-check' } as const
    case 'warning': return { label: 'Needs attention', color: 'warning', icon: 'i-lucide-triangle-alert' } as const
    case 'locked': return { label: 'Account locked', color: 'error', icon: 'i-lucide-lock' } as const
    default: return null
  }
})

const limit = computed(() => account.value?.droplet_limit ?? 0)
const usagePct = computed(() =>
  limit.value > 0 ? Math.min(100, Math.round((props.dropletCount / limit.value) * 100)) : 0
)
</script>

<template>
  <div class="animate-rise relative overflow-hidden rounded-xl border border-default bg-gradient-to-br from-primary/10 via-elevated/30 to-bg p-6 sm:p-8">
    <!-- Soft brand glow, purely decorative -->
    <div
      class="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-primary/20 blur-3xl"
      aria-hidden="true"
    />

    <div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <!-- Identity -->
      <div class="min-w-0">
        <p class="text-sm text-muted">
          {{ greeting }}, welcome back to
        </p>
        <h1 class="mt-0.5 text-2xl font-semibold text-highlighted truncate">
          {{ team }}
        </h1>
        <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span
            v-if="email"
            class="inline-flex items-center gap-1.5 text-sm text-muted min-w-0"
          >
            <UIcon
              name="i-lucide-mail"
              class="size-3.5 shrink-0"
            />
            <span class="truncate">{{ email }}</span>
          </span>
          <UBadge
            v-if="statusMeta"
            :color="statusMeta.color"
            :icon="statusMeta.icon"
            variant="subtle"
            size="sm"
          >
            {{ statusMeta.label }}
          </UBadge>
        </div>
      </div>

      <!-- Usage + primary action -->
      <div class="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end lg:flex-col lg:items-stretch">
        <div class="rounded-lg border border-default bg-bg/60 px-4 py-3 backdrop-blur-sm sm:min-w-56">
          <div class="flex items-center justify-between gap-4">
            <span class="text-xs font-medium uppercase tracking-wide text-muted">
              Droplet usage
            </span>
            <span class="text-xs text-muted tabular-nums">
              {{ dropletCount }}<span v-if="limit"> / {{ limit }}</span>
            </span>
          </div>
          <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-accented">
            <div
              class="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
              :style="{ width: `${usagePct}%` }"
            />
          </div>
        </div>

        <UButton
          label="Create Droplet"
          icon="i-lucide-plus"
          size="lg"
          class="justify-center"
          @click="navigateTo('/droplets/new')"
        />
      </div>
    </div>
  </div>
</template>
