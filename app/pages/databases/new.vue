<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { DatabaseEngine, DatabaseCreateRequest } from '~/types/database'

useHead({ title: 'Create Database' })

const api = useDoApi()
const auth = useDoAuthStore()
const toast = useToast()
const queryCache = useQueryCache()

const { options, isPending: optionsLoading } = useDatabaseOptions()

// --- Selection state ---
const engine = ref<DatabaseEngine | null>(null)
const version = ref<string | null>(null)
const numNodes = ref<number | null>(null)
const size = ref<string | null>(null)
const region = ref<string | null>(null)
const name = ref('')
const tags = ref<string[]>([])

const engineOptions = computed(() => (engine.value ? options.value[engine.value] : undefined))
const versions = computed(() => engineOptions.value?.versions ?? [])
const layouts = computed(() => engineOptions.value?.layouts ?? [])
const regions = computed(() => engineOptions.value?.regions ?? [])
const sizesForNodes = computed(() => layouts.value.find(l => l.num_nodes === numNodes.value)?.sizes ?? [])

// --- Defaults: pick the first engine, latest version, smallest single-node plan, a common region ---
watch(options, () => {
  if (engine.value) return
  engine.value = options.value.pg ? 'pg' : (databaseEngineOrder.find(e => options.value[e]) ?? null)
}, { immediate: true })

// When the engine changes, reset the dependent choices to sensible defaults for that engine.
watch(engine, () => {
  version.value = versions.value[versions.value.length - 1] ?? null
  numNodes.value = layouts.value[0]?.num_nodes ?? 1
  region.value = regions.value.includes('nyc1') ? 'nyc1' : (regions.value[0] ?? null)
})

// Keep the plan valid for the chosen node count.
watch([layouts, numNodes], () => {
  if (!sizesForNodes.value.length) return
  if (size.value && sizesForNodes.value.includes(size.value)) return
  size.value = sizesForNodes.value[0] ?? null
})

// --- Summary helpers ---
const nameTrimmed = computed(() => name.value.trim())
const canCreate = computed(() =>
  !!engine.value && !!version.value && !!size.value && !!region.value && !!numNodes.value && !!nameTrimmed.value
)

// --- Submit ---
const loading = ref(false)
async function onCreate() {
  if (!canCreate.value || loading.value) return
  loading.value = true

  const body: DatabaseCreateRequest = {
    name: nameTrimmed.value,
    engine: engine.value!,
    version: version.value ?? undefined,
    size: size.value!,
    region: region.value!,
    num_nodes: numNodes.value!
  }
  if (tags.value.length) body.tags = [...tags.value]

  try {
    await api.databases.create(body)
    queryCache.invalidateQueries({ key: databaseKeys.list(auth.activeId) })
    toast.add({
      title: `Creating ${body.name}…`,
      description: 'Your database cluster is being provisioned. This can take a few minutes.',
      color: 'success',
      icon: 'i-lucide-circle-check'
    })
    await navigateTo('/databases')
  } catch (err) {
    const handledGlobally = err instanceof FetchError && (err.statusCode === 401 || err.statusCode === 429)
    if (!handledGlobally) {
      toast.add({
        title: 'Could not create database',
        description: err instanceof FetchError
          ? (err.data?.message ?? err.statusMessage ?? 'Something went wrong')
          : (err instanceof Error ? err.message : undefined),
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="database-create">
    <template #header>
      <UDashboardNavbar
        title="Create Database"
        :toggle="false"
      >
        <template #leading>
          <div class="flex items-center gap-1">
            <UButton
              icon="i-lucide-arrow-left"
              color="neutral"
              variant="ghost"
              aria-label="Back to Databases"
              @click="navigateTo('/databases')"
            />
            <UDashboardSidebarCollapse />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full max-w-5xl mx-auto">
        <div class="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
          <!-- Selection column -->
          <div class="flex-1 min-w-0 space-y-10">
            <DatabaseEngineStep
              v-model="engine"
              :options="options"
              :loading="optionsLoading"
            />

            <DatabasePlanStep
              v-model:version="version"
              v-model:num-nodes="numNodes"
              v-model:size="size"
              :versions="versions"
              :layouts="layouts"
              :loading="optionsLoading"
              :engine-selected="!!engine"
            />

            <DatabaseRegionStep
              v-model="region"
              :regions="regions"
              :loading="optionsLoading"
              :engine-selected="!!engine"
            />

            <DatabaseNameStep
              v-model:name="name"
              v-model:tags="tags"
            />
          </div>

          <!-- Sticky summary -->
          <aside class="lg:w-80 lg:shrink-0 lg:sticky lg:top-4">
            <div class="rounded-xl border border-default bg-elevated/50 overflow-hidden">
              <div class="px-4 py-3 border-b border-default flex items-center gap-2">
                <DatabaseEngineIcon
                  v-if="engine"
                  :engine="engine"
                  size="sm"
                />
                <h2 class="text-sm font-semibold text-highlighted">
                  Summary
                </h2>
              </div>

              <dl class="p-4 space-y-3 text-sm">
                <div class="flex items-start justify-between gap-3">
                  <dt class="text-muted shrink-0">
                    Engine
                  </dt>
                  <dd class="text-highlighted font-medium text-right truncate">
                    {{ engine ? `${engineMeta(engine).label} ${version ?? ''}` : '—' }}
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-3">
                  <dt class="text-muted shrink-0">
                    Plan
                  </dt>
                  <dd class="text-highlighted font-medium text-right">
                    {{ size ? (databaseSizeSpecs(size) ?? size) : '—' }}
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-3">
                  <dt class="text-muted shrink-0">
                    Nodes
                  </dt>
                  <dd class="text-highlighted font-medium text-right">
                    {{ numNodes ?? '—' }}
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-3">
                  <dt class="text-muted shrink-0">
                    Region
                  </dt>
                  <dd class="text-highlighted font-medium text-right truncate">
                    {{ region ? regionName(region) : '—' }}
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-3">
                  <dt class="text-muted shrink-0">
                    Name
                  </dt>
                  <dd class="text-highlighted font-medium text-right truncate">
                    {{ nameTrimmed || '—' }}
                  </dd>
                </div>
              </dl>

              <div class="p-4 border-t border-default">
                <UButton
                  label="Create Database"
                  icon="i-lucide-plus"
                  block
                  size="lg"
                  :loading="loading"
                  :disabled="!canCreate"
                  @click="onCreate"
                />
                <p
                  v-if="!canCreate && !loading"
                  class="text-xs text-muted text-center mt-2"
                >
                  Choose an engine, plan, region, and name to continue.
                </p>
                <p
                  v-else-if="!loading"
                  class="text-xs text-muted text-center mt-2"
                >
                  Billed per DigitalOcean's managed database pricing.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
