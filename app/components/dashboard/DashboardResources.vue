<script setup lang="ts">
/**
 * Quick-launch tiles for each resource area. Droplets is live (links to the list with its
 * count); the rest are styled placeholders that light up as each vertical slice ships.
 */
const props = defineProps<{ dropletCount: number, databaseCount: number, loading?: boolean }>()

const resources = computed(() => [
  { label: 'Droplets', icon: 'i-lucide-server', to: '/droplets', count: props.dropletCount, available: true },
  { label: 'Databases', icon: 'i-lucide-database', to: '/databases', count: props.databaseCount, available: true },
  { label: 'Kubernetes', icon: 'i-lucide-ship-wheel', available: false },
  { label: 'Firewalls', icon: 'i-lucide-shield', available: false },
  { label: 'Load Balancers', icon: 'i-lucide-scale', available: false },
  { label: 'Domains', icon: 'i-lucide-globe', available: false }
])
</script>

<template>
  <section>
    <h2 class="mb-3 text-sm font-semibold text-muted uppercase tracking-wide">
      Resources
    </h2>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <component
        :is="resource.available ? 'NuxtLink' : 'div'"
        v-for="resource in resources"
        :key="resource.label"
        :to="resource.available ? resource.to : undefined"
        class="group relative flex flex-col gap-3 rounded-lg border border-default bg-elevated/50 p-4 transition-all"
        :class="resource.available
          ? 'cursor-pointer hover:border-primary/50 hover:bg-elevated hover:-translate-y-0.5'
          : 'opacity-60'"
      >
        <div class="flex items-center justify-between">
          <div
            class="size-9 rounded-lg flex items-center justify-center shrink-0 transition-colors"
            :class="resource.available
              ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-inverted'
              : 'bg-accented text-muted'"
          >
            <UIcon
              :name="resource.icon"
              class="size-5"
            />
          </div>
          <UIcon
            v-if="resource.available"
            name="i-lucide-arrow-up-right"
            class="size-4 text-dimmed transition-colors group-hover:text-primary"
          />
          <UBadge
            v-else
            label="Soon"
            color="neutral"
            variant="subtle"
            size="xs"
          />
        </div>
        <div class="min-w-0">
          <p class="font-medium text-highlighted truncate">
            {{ resource.label }}
          </p>
          <USkeleton
            v-if="resource.available && loading"
            class="mt-1 h-4 w-16"
          />
          <p
            v-else-if="resource.available"
            class="text-sm text-muted tabular-nums"
          >
            {{ resource.count }} {{ resource.count === 1 ? 'resource' : 'resources' }}
          </p>
          <p
            v-else
            class="text-sm text-dimmed"
          >
            Coming soon
          </p>
        </div>
      </component>
    </div>
  </section>
</template>
