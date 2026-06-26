<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'

/**
 * The connection panel — the feature that makes this console worth opening: every credential is
 * one click from the clipboard, secrets are masked until revealed, and you can flip between the
 * public and VPC-private endpoints. The official console buries this.
 */
const props = defineProps<{ database: DatabaseCluster }>()

const api = useDoApi()
const toast = useToast()

const hasPrivate = computed(() => !!props.database.private_connection)
const view = ref<'public' | 'private'>('public')
const conn = computed(() =>
  view.value === 'private' && props.database.private_connection
    ? props.database.private_connection
    : props.database.connection
)

// Copyable, non-secret fields. Values can be redacted (read-only tokens), so guard each.
const fields = computed(() => {
  const c = conn.value
  if (!c) return []
  return [
    { label: 'Host', value: c.host ?? '' },
    { label: 'Port', value: c.port != null ? String(c.port) : '' },
    { label: 'Database', value: c.database ?? '' },
    { label: 'User', value: c.user ?? '' }
  ]
})

const downloadingCa = ref(false)
async function downloadCa() {
  downloadingCa.value = true
  try {
    const { ca } = await api.databases.getCa(props.database.id)
    // DO returns the CA base64-encoded; some responses are already PEM — handle both.
    const raw = ca.certificate
    const pem = raw.startsWith('-----BEGIN') ? raw : atob(raw)
    const blob = new Blob([pem], { type: 'application/x-pem-file' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${props.database.name}-ca-certificate.crt`
    link.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.add({ title: 'Could not download the CA certificate', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    downloadingCa.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <UCard
      v-if="conn"
      variant="subtle"
    >
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-plug"
              class="size-4 text-muted"
            />
            <h3 class="font-semibold text-highlighted">
              Connection details
            </h3>
          </div>

          <!-- Public / private (VPC) endpoint toggle -->
          <div
            v-if="hasPrivate"
            class="inline-flex rounded-md border border-default bg-elevated p-0.5"
          >
            <button
              type="button"
              class="cursor-pointer rounded px-3 py-1 text-sm font-medium transition-colors"
              :class="view === 'public' ? 'bg-default text-highlighted shadow-sm' : 'text-muted hover:text-default'"
              @click="view = 'public'"
            >
              Public
            </button>
            <button
              type="button"
              class="cursor-pointer rounded px-3 py-1 text-sm font-medium transition-colors"
              :class="view === 'private' ? 'bg-default text-highlighted shadow-sm' : 'text-muted hover:text-default'"
              @click="view = 'private'"
            >
              Private (VPC)
            </button>
          </div>
        </div>
      </template>

      <!-- Connection string -->
      <div class="rounded-lg border border-default bg-elevated/50 p-3 mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span class="text-xs font-medium uppercase tracking-wide text-muted">
          Connection string
        </span>
        <DatabaseSecretValue
          :value="conn.uri"
          label="Connection string"
        />
      </div>

      <!-- Individual fields -->
      <dl class="divide-y divide-default">
        <div
          v-for="field in fields"
          :key="field.label"
          class="flex items-center justify-between gap-4 py-2.5"
        >
          <dt class="text-sm text-muted shrink-0">
            {{ field.label }}
          </dt>
          <dd class="min-w-0">
            <CopyableValue
              v-if="field.value"
              :value="field.value"
              :label="field.label"
            />
            <span
              v-else
              class="text-sm text-dimmed"
            >—</span>
          </dd>
        </div>
        <div class="flex items-center justify-between gap-4 py-2.5">
          <dt class="text-sm text-muted shrink-0">
            Password
          </dt>
          <dd class="min-w-0">
            <DatabaseSecretValue
              :value="conn.password"
              label="Password"
            />
          </dd>
        </div>
        <div class="flex items-center justify-between gap-4 py-2.5">
          <dt class="text-sm text-muted shrink-0">
            SSL
          </dt>
          <dd>
            <UBadge
              :color="conn.ssl ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
              :icon="conn.ssl ? 'i-lucide-lock' : 'i-lucide-lock-open'"
            >
              {{ conn.ssl ? 'Required' : 'Optional' }}
            </UBadge>
          </dd>
        </div>
      </dl>

      <template #footer>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs text-muted max-w-md">
            Connections are encrypted with TLS. Download the CA certificate to verify the server from your client.
          </p>
          <UButton
            label="Download CA certificate"
            icon="i-lucide-download"
            color="neutral"
            variant="outline"
            size="sm"
            :loading="downloadingCa"
            @click="downloadCa"
          />
        </div>
      </template>
    </UCard>

    <!-- Connection not ready (still provisioning) -->
    <UCard
      v-else
      variant="subtle"
    >
      <div class="flex flex-col items-center text-center gap-2 py-8">
        <div class="size-10 rounded-lg bg-elevated flex items-center justify-center">
          <UIcon
            name="i-lucide-plug-zap"
            class="size-5 text-dimmed"
          />
        </div>
        <p class="text-sm font-medium text-highlighted">
          Connection details aren't ready
        </p>
        <p class="text-sm text-muted max-w-sm">
          They'll appear here once the cluster finishes provisioning.
        </p>
      </div>
    </UCard>
  </div>
</template>
