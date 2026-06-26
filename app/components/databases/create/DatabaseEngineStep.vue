<script setup lang="ts">
import type { DatabaseEngine, DatabaseEngineOptions } from '~/types/database'

const props = defineProps<{
  options: Partial<Record<DatabaseEngine, DatabaseEngineOptions>>
  loading: boolean
}>()

const selected = defineModel<DatabaseEngine | null>({ default: null })

const engines = computed(() => databaseEngineOrder.filter(e => props.options[e]))

function select(engine: DatabaseEngine) {
  selected.value = engine
}
</script>

<template>
  <section>
    <div class="mb-3">
      <h2 class="text-base font-semibold text-highlighted">
        Engine
      </h2>
      <p class="text-sm text-muted">
        Choose the database engine. This determines the versions, plans, and regions available.
      </p>
    </div>

    <div
      v-if="loading"
      class="grid grid-cols-2 sm:grid-cols-3 gap-3"
    >
      <USkeleton
        v-for="i in 6"
        :key="i"
        class="h-[4.5rem] rounded-lg"
      />
    </div>

    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 gap-3"
    >
      <button
        v-for="engine in engines"
        :key="engine"
        type="button"
        :aria-pressed="selected === engine"
        class="group relative cursor-pointer text-left rounded-lg border p-3 flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :class="selected === engine
          ? 'border-primary bg-primary/10 ring-1 ring-primary'
          : 'border-default bg-elevated/50 hover:border-primary/50 hover:bg-elevated'"
        @click="select(engine)"
      >
        <DatabaseEngineIcon :engine="engine" />
        <div class="min-w-0">
          <div class="font-medium text-highlighted truncate">
            {{ engineMeta(engine).label }}
          </div>
          <div class="text-xs text-muted">
            {{ options[engine]?.versions.length ?? 0 }} version{{ (options[engine]?.versions.length ?? 0) === 1 ? '' : 's' }}
          </div>
        </div>
        <UIcon
          v-if="selected === engine"
          name="i-lucide-check-circle-2"
          class="absolute top-2 right-2 size-4 text-primary"
        />
      </button>
    </div>
  </section>
</template>
