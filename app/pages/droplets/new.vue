<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { DropletCreateRequest } from '~/types/droplet'

useHead({ title: 'Create Droplet' })

const api = useDoApi()
const auth = useDoAuthStore()
const toast = useToast()
const queryCache = useQueryCache()

// --- Lookups (one query each, keyed by the active team) ---
const regionsQuery = useQuery({
  key: () => lookupKeys.regions(auth.activeId),
  query: () => api.regions.list(),
  enabled: () => auth.isConnected
})
const sizesQuery = useQuery({
  key: () => lookupKeys.sizes(auth.activeId),
  query: () => api.sizes.list(),
  enabled: () => auth.isConnected
})
const imagesQuery = useQuery({
  key: () => lookupKeys.images(auth.activeId, 'distribution'),
  query: () => api.images.list('distribution'),
  enabled: () => auth.isConnected
})
const sshKeysQuery = useQuery({
  key: () => lookupKeys.sshKeys(auth.activeId),
  query: () => api.sshKeys.list(),
  enabled: () => auth.isConnected
})

const regions = computed(() => regionsQuery.state.value.data?.regions ?? [])
const sizes = computed(() => sizesQuery.state.value.data?.sizes ?? [])
const images = computed(() => imagesQuery.state.value.data?.images ?? [])
const sshKeys = computed(() => sshKeysQuery.state.value.data?.ssh_keys ?? [])

const regionsLoading = computed(() => regionsQuery.asyncStatus.value === 'loading')
const sizesLoading = computed(() => sizesQuery.asyncStatus.value === 'loading')
const imagesLoading = computed(() => imagesQuery.asyncStatus.value === 'loading')
const sshKeysLoading = computed(() => sshKeysQuery.asyncStatus.value === 'loading')

// --- Selection state ---
const selectedRegion = ref<string | null>(null)
const selectedSize = ref<string | null>(null)
const selectedImage = ref<string | number | null>(null)
const selectedSshKeys = ref<number[]>([])
const backups = ref(false)
const ipv6 = ref(false)
const monitoring = ref(true)
const tags = ref<string[]>([])
const name = ref('')

// Sizes available in the chosen region (the plan list narrows as soon as a region is picked).
const regionSizes = computed(() => {
  if (!selectedRegion.value) return []
  return sizes.value.filter(s => s.available && s.regions.includes(selectedRegion.value!))
})

// The full size object backing the current plan choice (drives the cost in the summary).
const selectedSizeObject = computed(() =>
  regionSizes.value.find(s => s.slug === selectedSize.value) ?? null
)

const selectedRegionObject = computed(() =>
  regions.value.find(r => r.slug === selectedRegion.value) ?? null
)

const selectedImageObject = computed(() =>
  images.value.find(i => (i.slug ?? i.id) === selectedImage.value) ?? null
)

// --- Defaults: pick a sensible region, a small Basic plan, and a recent Ubuntu LTS ---
watchEffect(() => {
  if (selectedRegion.value || !regions.value.length) return
  const available = regions.value.filter(r => r.available)
  // Prefer NYC for a familiar default, else the first available region.
  const preferred = available.find(r => r.slug.startsWith('nyc')) ?? available[0]
  if (preferred) selectedRegion.value = preferred.slug
})

watchEffect(() => {
  const list = regionSizes.value
  if (!list.length) return
  // Keep the choice if it's still valid for the region; otherwise pick a small standard plan.
  if (selectedSize.value && list.some(s => s.slug === selectedSize.value)) return
  const basic = list
    .filter(s => s.slug.startsWith('s-'))
    .sort((a, b) => a.price_monthly - b.price_monthly)
  selectedSize.value = (basic[0] ?? [...list].sort((a, b) => a.price_monthly - b.price_monthly)[0])?.slug ?? null
})

watchEffect(() => {
  if (selectedImage.value != null || !images.value.length) return
  const ubuntu = images.value
    .filter(i => i.distribution === 'Ubuntu')
    .sort((a, b) => (b.slug ?? '').localeCompare(a.slug ?? ''))
  const fallback = ubuntu[0] ?? images.value[0]
  if (fallback) selectedImage.value = fallback.slug ?? fallback.id
})

// --- Validation ---
const nameTrimmed = computed(() => name.value.trim())
const hasNoSshKeys = computed(() => !sshKeysLoading.value && sshKeys.value.length === 0)

const canCreate = computed(() =>
  !!nameTrimmed.value
  && !!selectedRegion.value
  && !!selectedSize.value
  && selectedImage.value != null
)

// --- Submit ---
const loading = ref(false)

async function onCreate() {
  if (!canCreate.value || loading.value) return
  loading.value = true

  const body: DropletCreateRequest = {
    name: nameTrimmed.value,
    region: selectedRegion.value!,
    size: selectedSize.value!,
    image: selectedImage.value!,
    backups: backups.value,
    ipv6: ipv6.value,
    monitoring: monitoring.value
  }
  if (selectedSshKeys.value.length) body.ssh_keys = [...selectedSshKeys.value]
  if (tags.value.length) body.tags = [...tags.value]

  try {
    await api.droplets.create(body)
    queryCache.invalidateQueries({ key: dropletKeys.list(auth.activeId) })
    toast.add({
      title: `Creating ${body.name}…`,
      description: 'Your Droplet is being provisioned.',
      color: 'success',
      icon: 'i-lucide-circle-check'
    })
    await navigateTo('/droplets')
  } catch (err) {
    const handledGlobally = err instanceof FetchError && (err.statusCode === 401 || err.statusCode === 429)
    if (!handledGlobally) {
      toast.add({
        title: 'Could not create Droplet',
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
  <UDashboardPanel id="droplet-create">
    <template #header>
      <UDashboardNavbar
        title="Create Droplet"
        :toggle="false"
      >
        <template #leading>
          <div class="flex items-center gap-1">
            <UButton
              icon="i-lucide-arrow-left"
              color="neutral"
              variant="ghost"
              aria-label="Back to Droplets"
              @click="navigateTo('/droplets')"
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
            <RegionStep
              v-model="selectedRegion"
              :regions="regions"
              :loading="regionsLoading"
            />

            <SizeStep
              v-model="selectedSize"
              :sizes="regionSizes"
              :loading="sizesLoading"
              :region-selected="!!selectedRegion"
            />

            <ImageStep
              v-model="selectedImage"
              :images="images"
              :loading="imagesLoading"
            />

            <OptionsStep
              v-model:ssh-keys="selectedSshKeys"
              v-model:backups="backups"
              v-model:ipv6="ipv6"
              v-model:monitoring="monitoring"
              v-model:tags="tags"
              v-model:name="name"
              :ssh-key-list="sshKeys"
              :ssh-keys-loading="sshKeysLoading"
              :has-no-ssh-keys="hasNoSshKeys"
            />
          </div>

          <!-- Sticky summary -->
          <aside class="lg:w-80 lg:shrink-0 lg:sticky lg:top-4">
            <div class="rounded-xl border border-default bg-elevated/50 overflow-hidden">
              <div class="px-4 py-3 border-b border-default">
                <h2 class="text-sm font-semibold text-highlighted">
                  Summary
                </h2>
              </div>

              <dl class="p-4 space-y-3 text-sm">
                <div class="flex items-start justify-between gap-3">
                  <dt class="text-muted shrink-0">
                    Region
                  </dt>
                  <dd class="text-highlighted font-medium text-right truncate">
                    {{ selectedRegionObject?.name ?? '—' }}
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-3">
                  <dt class="text-muted shrink-0">
                    Image
                  </dt>
                  <dd class="text-highlighted font-medium text-right truncate">
                    <template v-if="selectedImageObject">
                      {{ selectedImageObject.distribution }} {{ selectedImageObject.name }}
                    </template>
                    <template v-else>
                      —
                    </template>
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-3">
                  <dt class="text-muted shrink-0">
                    Plan
                  </dt>
                  <dd class="text-highlighted font-medium text-right">
                    <template v-if="selectedSizeObject">
                      {{ formatMemory(selectedSizeObject.memory) }} · {{ selectedSizeObject.vcpus }} vCPU
                    </template>
                    <template v-else>
                      —
                    </template>
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

              <div class="px-4 py-3 border-t border-default flex items-baseline justify-between">
                <span class="text-sm text-muted">Estimated cost</span>
                <span class="text-highlighted">
                  <span class="text-lg font-semibold">{{ selectedSizeObject ? formatPrice(selectedSizeObject.price_monthly) : '—' }}</span>
                  <span class="text-sm text-muted">/mo</span>
                </span>
              </div>

              <div class="p-4 border-t border-default">
                <UButton
                  label="Create Droplet"
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
                  Choose a region, image, plan, and name to continue.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
