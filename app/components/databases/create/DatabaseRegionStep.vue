<script setup lang="ts">
const props = defineProps<{
  regions: string[]
  loading: boolean
  engineSelected: boolean
}>()

const selected = defineModel<string | null>({ default: null })

const available = computed(() => [...props.regions].sort())

function select(slug: string) {
  selected.value = slug
}
</script>

<template>
  <section>
    <div class="mb-3">
      <h2 class="text-base font-semibold text-highlighted">
        Region
      </h2>
      <p class="text-sm text-muted">
        Choose the datacenter closest to your application for the lowest latency.
      </p>
    </div>

    <div
      v-if="!engineSelected"
      class="rounded-lg border border-dashed border-default p-6 text-center text-sm text-muted"
    >
      Select an engine to see available regions.
    </div>

    <div
      v-else-if="loading"
      class="grid grid-cols-2 sm:grid-cols-3 gap-3"
    >
      <USkeleton
        v-for="i in 6"
        :key="i"
        class="h-16 rounded-lg"
      />
    </div>

    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 gap-3"
    >
      <button
        v-for="slug in available"
        :key="slug"
        type="button"
        :aria-pressed="selected === slug"
        class="group relative cursor-pointer text-left rounded-lg border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :class="selected === slug
          ? 'border-primary bg-primary/10 ring-1 ring-primary'
          : 'border-default bg-elevated/50 hover:border-primary/50 hover:bg-elevated'"
        @click="select(slug)"
      >
        <UIcon
          v-if="selected === slug"
          name="i-lucide-check-circle-2"
          class="absolute top-2 right-2 size-4 text-primary"
        />
        <div class="font-medium text-highlighted truncate pr-5">
          {{ regionName(slug) }}
        </div>
        <div class="text-xs text-muted font-mono mt-0.5">
          {{ slug }}
        </div>
      </button>
    </div>
  </section>
</template>
