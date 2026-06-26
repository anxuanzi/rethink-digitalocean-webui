<script setup lang="ts">
import type { Droplet } from '~/types/droplet'

const props = defineProps<{ droplet: Droplet }>()

const actions = useDropletActions()

const publicV4 = computed(() => props.droplet.networks?.v4?.find(n => n.type === 'public') ?? null)
const privateV4 = computed(() => props.droplet.networks?.v4?.find(n => n.type === 'private') ?? null)
const ipv6 = computed(() => props.droplet.networks?.v6?.[0] ?? null)
</script>

<template>
  <div class="space-y-6">
    <!-- Public IPv4 -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-globe"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Public network
          </h3>
        </div>
      </template>

      <div
        v-if="publicV4"
        class="space-y-3"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span class="text-sm text-muted">IPv4 address</span>
          <CopyableValue
            :value="publicV4.ip_address"
            label="Public IPv4"
          />
        </div>
        <div class="flex items-center justify-between gap-4 text-xs">
          <span class="text-dimmed">Netmask</span>
          <span class="font-mono text-muted">{{ publicV4.netmask }}</span>
        </div>
        <div class="flex items-center justify-between gap-4 text-xs">
          <span class="text-dimmed">Gateway</span>
          <span class="font-mono text-muted">{{ publicV4.gateway }}</span>
        </div>
      </div>
      <p
        v-else
        class="text-sm text-muted"
      >
        This Droplet has no public IPv4 address.
      </p>
    </UCard>

    <!-- Private IPv4 -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-network"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Private network
          </h3>
        </div>
      </template>

      <div
        v-if="privateV4"
        class="space-y-3"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span class="text-sm text-muted">IPv4 address</span>
          <CopyableValue
            :value="privateV4.ip_address"
            label="Private IPv4"
          />
        </div>
        <div class="flex items-center justify-between gap-4 text-xs">
          <span class="text-dimmed">Netmask</span>
          <span class="font-mono text-muted">{{ privateV4.netmask }}</span>
        </div>
        <div class="flex items-center justify-between gap-4 text-xs">
          <span class="text-dimmed">Gateway</span>
          <span class="font-mono text-muted">{{ privateV4.gateway }}</span>
        </div>
      </div>
      <div
        v-else
        class="flex flex-col items-center text-center gap-2 py-4"
      >
        <div class="size-10 rounded-lg bg-elevated flex items-center justify-center">
          <UIcon
            name="i-lucide-network"
            class="size-5 text-dimmed"
          />
        </div>
        <p class="text-sm font-medium text-highlighted">
          Private networking is off
        </p>
        <p class="text-sm text-muted max-w-sm">
          A private IP lets this Droplet talk to others in the same datacenter without using public bandwidth. Enable it from the DigitalOcean control panel when creating or via a VPC.
        </p>
      </div>
    </UCard>

    <!-- IPv6 -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-globe-lock"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            IPv6
          </h3>
        </div>
      </template>

      <div
        v-if="ipv6"
        class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
      >
        <span class="text-sm text-muted">IPv6 address</span>
        <CopyableValue
          :value="ipv6.ip_address"
          label="IPv6"
        />
      </div>
      <div
        v-else
        class="flex flex-col items-center text-center gap-3 py-4"
      >
        <div class="size-10 rounded-lg bg-elevated flex items-center justify-center">
          <UIcon
            name="i-lucide-globe-lock"
            class="size-5 text-dimmed"
          />
        </div>
        <div>
          <p class="text-sm font-medium text-highlighted">
            IPv6 is not enabled
          </p>
          <p class="text-sm text-muted max-w-sm">
            Add a public IPv6 address to this Droplet at no extra cost.
          </p>
        </div>
        <UButton
          label="Enable IPv6"
          icon="i-lucide-plus"
          color="primary"
          variant="solid"
          size="sm"
          :loading="actions.isBusy(droplet.id)"
          @click="actions.enableIpv6(droplet)"
        />
      </div>
    </UCard>
  </div>
</template>
