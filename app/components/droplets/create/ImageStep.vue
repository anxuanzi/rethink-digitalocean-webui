<script setup lang="ts">
import type { DropletImage } from '~/types/droplet'

const props = defineProps<{
  images: DropletImage[]
  loading: boolean
}>()

// Bind the image slug when present (the API's preferred identifier), else the numeric id.
const selected = defineModel<string | number | null>({ default: null })

// Map a distribution name to a brand icon; everything else gets a neutral disc.
const distroIcons: Record<string, string> = {
  'Ubuntu': 'i-simple-icons-ubuntu',
  'Debian': 'i-simple-icons-debian',
  'Fedora': 'i-simple-icons-fedora',
  'CentOS': 'i-simple-icons-centos',
  'Rocky Linux': 'i-simple-icons-rockylinux',
  'AlmaLinux': 'i-simple-icons-almalinux'
}
function iconFor(distribution: string): string {
  return distroIcons[distribution] ?? 'i-lucide-disc-3'
}

interface DistroGroup {
  distribution: string
  icon: string
  versions: DropletImage[]
}

// Group images by distribution, newest version first within each group.
const groups = computed<DistroGroup[]>(() => {
  const byDistro = new Map<string, DropletImage[]>()
  for (const image of props.images) {
    const list = byDistro.get(image.distribution) ?? []
    list.push(image)
    byDistro.set(image.distribution, list)
  }
  return [...byDistro.entries()]
    .map(([distribution, versions]) => ({
      distribution,
      icon: iconFor(distribution),
      versions: versions
        .slice()
        .sort((a, b) => (b.slug ?? b.name).localeCompare(a.slug ?? a.name))
    }))
    .sort((a, b) => a.distribution.localeCompare(b.distribution))
})

function keyFor(image: DropletImage): string | number {
  return image.slug ?? image.id
}
function isSelected(image: DropletImage): boolean {
  return selected.value === keyFor(image)
}
function select(image: DropletImage) {
  selected.value = keyFor(image)
}
</script>

<template>
  <section>
    <div class="mb-3">
      <h2 class="text-base font-semibold text-highlighted">
        Image
      </h2>
      <p class="text-sm text-muted">
        Choose the operating system for your Droplet.
      </p>
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="loading"
      class="space-y-5"
    >
      <div
        v-for="i in 2"
        :key="i"
        class="space-y-2"
      >
        <USkeleton class="h-4 w-24 rounded" />
        <div class="flex flex-wrap gap-2">
          <USkeleton
            v-for="j in 4"
            :key="j"
            class="h-9 w-28 rounded-lg"
          />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!groups.length"
      class="rounded-lg border border-dashed border-default p-6 text-center"
    >
      <UIcon
        name="i-lucide-disc-3"
        class="size-6 text-dimmed mx-auto mb-2"
      />
      <p class="text-sm font-medium text-highlighted">
        No images available
      </p>
      <p class="text-sm text-muted">
        No distribution images were returned for this account.
      </p>
    </div>

    <!-- Distribution groups -->
    <div
      v-else
      class="space-y-5"
    >
      <div
        v-for="group in groups"
        :key="group.distribution"
      >
        <div class="flex items-center gap-2 mb-2">
          <UIcon
            :name="group.icon"
            class="size-4 text-muted"
          />
          <h3 class="text-sm font-medium text-default">
            {{ group.distribution }}
          </h3>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="image in group.versions"
            :key="keyFor(image)"
            type="button"
            :aria-pressed="isSelected(image)"
            class="cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            :class="isSelected(image)
              ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
              : 'border-default bg-elevated/50 text-default hover:border-primary/50 hover:bg-elevated'"
            @click="select(image)"
          >
            {{ image.name }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
