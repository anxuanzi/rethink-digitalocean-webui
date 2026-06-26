<script setup lang="ts">
import type { Droplet } from '~/types/droplet'

const props = defineProps<{ droplet: Droplet }>()

const menu = useDropletMenu()
const notes = useDropletNotesStore()

const note = computed(() => notes.getNote(props.droplet.id))

/**
 * The hardware + plan facts, rendered as a grid of tiles. Capacity/plan specs carry a
 * category tint (compute = primary, memory/location = info, storage = warning, plan = success);
 * plain metadata stays neutral, so the eye lands on the numbers that matter first.
 */
const specs = computed(() => [
  { label: 'vCPUs', value: `${props.droplet.vcpus}`, icon: 'i-lucide-cpu', tint: 'bg-primary/10 text-primary' },
  { label: 'Memory', value: formatMemory(props.droplet.memory), icon: 'i-lucide-memory-stick', tint: 'bg-info/10 text-info' },
  { label: 'Disk', value: formatDisk(props.droplet.disk), icon: 'i-lucide-hard-drive', tint: 'bg-warning/10 text-warning' },
  {
    label: 'Plan',
    value: props.droplet.size_slug,
    sub: `${formatPrice(props.droplet.size.price_monthly)}/mo`,
    icon: 'i-lucide-box',
    tint: 'bg-success/10 text-success'
  },
  {
    label: 'Image',
    value: props.droplet.image.distribution || props.droplet.image.name,
    sub: props.droplet.image.name,
    icon: 'i-lucide-disc',
    tint: 'bg-primary/10 text-primary'
  },
  { label: 'Region', value: props.droplet.region.name, sub: props.droplet.region.slug, icon: 'i-lucide-map-pin', tint: 'bg-info/10 text-info' },
  { label: 'Created', value: shortDate(props.droplet.created_at), sub: relativeTime(props.droplet.created_at), icon: 'i-lucide-calendar', tint: 'bg-elevated text-muted' },
  { label: 'Droplet ID', value: `${props.droplet.id}`, icon: 'i-lucide-hash', tint: 'bg-elevated text-muted' }
])
</script>

<template>
  <div class="space-y-6">
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-server"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Specs
          </h3>
        </div>
      </template>

      <dl class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="spec in specs"
          :key="spec.label"
          class="group rounded-lg border border-default bg-elevated/40 p-4 transition-all hover:border-primary/40 hover:bg-elevated"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="size-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              :class="spec.tint"
            >
              <UIcon
                :name="spec.icon"
                class="size-4.5"
              />
            </div>
            <dt class="text-xs font-medium uppercase tracking-wide text-muted truncate">
              {{ spec.label }}
            </dt>
          </div>
          <dd class="mt-3 text-lg font-semibold text-highlighted truncate leading-tight">
            {{ spec.value }}
          </dd>
          <dd
            v-if="spec.sub"
            class="mt-0.5 text-xs text-dimmed truncate"
          >
            {{ spec.sub }}
          </dd>
        </div>
      </dl>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-tag"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Tags
          </h3>
        </div>
      </template>

      <div
        v-if="droplet.tags.length"
        class="flex flex-wrap gap-2"
      >
        <UBadge
          v-for="tag in droplet.tags"
          :key="tag"
          color="neutral"
          variant="subtle"
          size="sm"
        >
          {{ tag }}
        </UBadge>
      </div>
      <p
        v-else
        class="text-sm text-muted"
      >
        No tags. Tags help you group and act on Droplets in bulk.
      </p>
    </UCard>

    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-sticky-note"
              class="size-4 text-muted"
            />
            <h3 class="font-semibold text-highlighted">
              Notes
            </h3>
            <span class="text-xs text-dimmed">Private to this browser</span>
          </div>
          <UButton
            :label="note ? 'Edit note' : 'Add note'"
            icon="i-lucide-pencil"
            color="neutral"
            variant="outline"
            size="sm"
            @click="menu.openNote(droplet)"
          />
        </div>
      </template>

      <p
        v-if="note"
        class="text-sm text-default whitespace-pre-wrap"
      >
        {{ note }}
      </p>
      <p
        v-else
        class="text-sm text-muted"
      >
        Add a private note to remember what this Droplet does — only you can see it, and it never leaves this browser.
      </p>
    </UCard>
  </div>
</template>
