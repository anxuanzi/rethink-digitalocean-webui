<script setup lang="ts">
import type { DatabaseLayout } from '~/types/database'

const props = defineProps<{
  versions: string[]
  layouts: DatabaseLayout[]
  loading: boolean
  engineSelected: boolean
}>()

const version = defineModel<string | null>('version', { default: null })
const numNodes = defineModel<number | null>('numNodes', { default: null })
const size = defineModel<string | null>('size', { default: null })

const nodeChoices = computed(() => props.layouts.map(l => l.num_nodes))
const sizesForNodes = computed(() => props.layouts.find(l => l.num_nodes === numNodes.value)?.sizes ?? [])

function nodeLabel(n: number) {
  if (n === 1) return 'Single node'
  return `${n} nodes`
}
function nodeHint(n: number) {
  if (n === 1) return 'No standby'
  return `Primary + ${n - 1} standby`
}
</script>

<template>
  <section>
    <div class="mb-3">
      <h2 class="text-base font-semibold text-highlighted">
        Version &amp; plan
      </h2>
      <p class="text-sm text-muted">
        Pick the engine version, node count, and hardware plan.
      </p>
    </div>

    <div
      v-if="!engineSelected"
      class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-muted"
    >
      Select an engine to see versions and plans.
    </div>

    <div
      v-else-if="loading"
      class="space-y-3"
    >
      <USkeleton class="h-9 w-full rounded-lg" />
      <USkeleton class="h-16 w-full rounded-lg" />
      <USkeleton class="h-12 w-full rounded-lg" />
    </div>

    <div
      v-else
      class="space-y-5"
    >
      <!-- Version -->
      <div>
        <p class="text-sm font-medium text-highlighted mb-2">
          Version
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="v in versions"
            :key="v"
            type="button"
            :aria-pressed="version === v"
            class="cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            :class="version === v
              ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
              : 'border-default bg-elevated/50 text-default hover:border-primary/50 hover:bg-elevated'"
            @click="version = v"
          >
            {{ v }}
          </button>
        </div>
      </div>

      <!-- Nodes -->
      <div>
        <p class="text-sm font-medium text-highlighted mb-2">
          Nodes
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            v-for="n in nodeChoices"
            :key="n"
            type="button"
            :aria-pressed="numNodes === n"
            class="cursor-pointer rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            :class="numNodes === n
              ? 'border-primary bg-primary/10 ring-1 ring-primary'
              : 'border-default bg-elevated/50 hover:border-primary/50 hover:bg-elevated'"
            @click="numNodes = n"
          >
            <div class="font-medium text-highlighted">
              {{ nodeLabel(n) }}
            </div>
            <div class="text-xs text-muted">
              {{ nodeHint(n) }}
            </div>
          </button>
        </div>
      </div>

      <!-- Plan -->
      <div>
        <p class="text-sm font-medium text-highlighted mb-2">
          Plan
        </p>
        <div class="space-y-2">
          <button
            v-for="slug in sizesForNodes"
            :key="slug"
            type="button"
            :aria-pressed="size === slug"
            class="w-full cursor-pointer text-left rounded-lg border px-4 py-3 flex items-center justify-between gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            :class="size === slug
              ? 'border-primary bg-primary/10 ring-1 ring-primary'
              : 'border-default bg-elevated/50 hover:border-primary/50 hover:bg-elevated'"
            @click="size = slug"
          >
            <span class="font-mono text-sm text-highlighted truncate">{{ slug }}</span>
            <span class="text-sm text-muted shrink-0">{{ databaseSizeSpecs(slug) ?? '—' }}</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
