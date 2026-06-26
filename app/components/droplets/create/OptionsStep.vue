<script setup lang="ts">
import type { SSHKey } from '~/types/droplet'

defineProps<{
  sshKeyList: SSHKey[]
  sshKeysLoading: boolean
  hasNoSshKeys: boolean
}>()

const sshKeys = defineModel<number[]>('sshKeys', { default: () => [] })
const backups = defineModel<boolean>('backups', { default: false })
const ipv6 = defineModel<boolean>('ipv6', { default: false })
const monitoring = defineModel<boolean>('monitoring', { default: true })
const tags = defineModel<string[]>('tags', { default: () => [] })
const name = defineModel<string>('name', { default: '' })

function toggleKey(id: number) {
  sshKeys.value = sshKeys.value.includes(id)
    ? sshKeys.value.filter(k => k !== id)
    : [...sshKeys.value, id]
}

const nameValid = computed(() => name.value.trim().length > 0)
</script>

<template>
  <section class="space-y-8">
    <!-- Authentication -->
    <div>
      <div class="mb-3">
        <h2 class="text-base font-semibold text-highlighted">
          Authentication
        </h2>
        <p class="text-sm text-muted">
          Add SSH keys for secure, password-less access.
        </p>
      </div>

      <!-- Loading -->
      <div
        v-if="sshKeysLoading"
        class="space-y-2"
      >
        <USkeleton
          v-for="i in 2"
          :key="i"
          class="h-12 rounded-lg"
        />
      </div>

      <!-- No keys on the account -->
      <UAlert
        v-else-if="hasNoSshKeys"
        color="info"
        variant="subtle"
        icon="i-lucide-key-round"
        title="No SSH keys on this account"
        description="A randomly generated root password will be emailed to you. Add SSH keys in the DigitalOcean control panel for key-based login."
      />

      <!-- Key list -->
      <div
        v-else
        class="space-y-2"
      >
        <button
          v-for="key in sshKeyList"
          :key="key.id"
          type="button"
          :aria-pressed="sshKeys.includes(key.id)"
          class="w-full cursor-pointer text-left rounded-lg border px-4 py-3 flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          :class="sshKeys.includes(key.id)
            ? 'border-primary bg-primary/10 ring-1 ring-primary'
            : 'border-default bg-elevated/50 hover:border-primary/50 hover:bg-elevated'"
          @click="toggleKey(key.id)"
        >
          <UIcon
            :name="sshKeys.includes(key.id) ? 'i-lucide-check-square' : 'i-lucide-square'"
            class="size-4 shrink-0"
            :class="sshKeys.includes(key.id) ? 'text-primary' : 'text-dimmed'"
          />
          <div class="min-w-0">
            <div class="font-medium text-highlighted truncate">
              {{ key.name }}
            </div>
            <div class="text-xs text-muted font-mono truncate">
              {{ key.fingerprint }}
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Additional options -->
    <div>
      <div class="mb-3">
        <h2 class="text-base font-semibold text-highlighted">
          Additional options
        </h2>
        <p class="text-sm text-muted">
          Enable extra features for this Droplet.
        </p>
      </div>

      <div class="rounded-lg border border-default divide-y divide-default overflow-hidden">
        <div class="flex items-start gap-3 px-4 py-3 bg-elevated/50">
          <UIcon
            name="i-lucide-history"
            class="size-5 text-muted shrink-0 mt-0.5"
          />
          <div class="min-w-0 flex-1">
            <label
              for="opt-backups"
              class="text-sm font-medium text-highlighted cursor-pointer"
            >
              Automated backups
            </label>
            <p class="text-xs text-muted">
              Weekly system-level backups (adds 20% to the Droplet cost).
            </p>
          </div>
          <USwitch
            id="opt-backups"
            v-model="backups"
            class="shrink-0 mt-0.5"
            aria-label="Automated backups"
          />
        </div>

        <div class="flex items-start gap-3 px-4 py-3 bg-elevated/50">
          <UIcon
            name="i-lucide-activity"
            class="size-5 text-muted shrink-0 mt-0.5"
          />
          <div class="min-w-0 flex-1">
            <label
              for="opt-monitoring"
              class="text-sm font-medium text-highlighted cursor-pointer"
            >
              Monitoring
            </label>
            <p class="text-xs text-muted">
              Free metrics, dashboards, and alerting via the DigitalOcean agent.
            </p>
          </div>
          <USwitch
            id="opt-monitoring"
            v-model="monitoring"
            class="shrink-0 mt-0.5"
            aria-label="Monitoring"
          />
        </div>

        <div class="flex items-start gap-3 px-4 py-3 bg-elevated/50">
          <UIcon
            name="i-lucide-network"
            class="size-5 text-muted shrink-0 mt-0.5"
          />
          <div class="min-w-0 flex-1">
            <label
              for="opt-ipv6"
              class="text-sm font-medium text-highlighted cursor-pointer"
            >
              IPv6
            </label>
            <p class="text-xs text-muted">
              Assign a public IPv6 address to this Droplet.
            </p>
          </div>
          <USwitch
            id="opt-ipv6"
            v-model="ipv6"
            class="shrink-0 mt-0.5"
            aria-label="IPv6"
          />
        </div>
      </div>
    </div>

    <!-- Tags -->
    <div>
      <div class="mb-3">
        <h2 class="text-base font-semibold text-highlighted">
          Tags
        </h2>
        <p class="text-sm text-muted">
          Optional labels to organize and filter your Droplets.
        </p>
      </div>
      <UInputTags
        v-model="tags"
        placeholder="Add a tag and press Enter"
        icon="i-lucide-tag"
        class="w-full"
      />
    </div>

    <!-- Name -->
    <div>
      <div class="mb-3">
        <h2 class="text-base font-semibold text-highlighted">
          Hostname
        </h2>
        <p class="text-sm text-muted">
          A name to identify your Droplet. It's also set as the hostname.
        </p>
      </div>
      <UFormField
        name="name"
        :error="name.length > 0 && !nameValid ? 'A name is required' : undefined"
      >
        <UInput
          v-model="name"
          placeholder="my-web-server-01"
          icon="i-lucide-server"
          autocomplete="off"
          class="w-full"
        />
      </UFormField>
      <p class="text-xs text-muted mt-1.5">
        Use letters, numbers, and hyphens — for example
        <span class="font-mono text-default">web-prod-01</span>.
      </p>
    </div>
  </section>
</template>
