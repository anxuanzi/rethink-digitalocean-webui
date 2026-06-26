<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'

const props = defineProps<{ database: DatabaseCluster }>()

const actions = useDatabaseActions()
const menu = useDatabaseMenu()

const busy = computed(() => actions.isBusy(props.database.id))
const specs = computed(() => databaseSizeSpecs(props.database.size))

// --- Maintenance window ---
const dayItems = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  .map(d => ({ label: d.charAt(0).toUpperCase() + d.slice(1), value: d }))
const hourItems = Array.from({ length: 24 }, (_, h) => {
  const hh = String(h).padStart(2, '0')
  return { label: `${hh}:00 UTC`, value: `${hh}:00` }
})

const day = ref(props.database.maintenance_window?.day || 'sunday')
const hour = ref((props.database.maintenance_window?.hour || '00:00').slice(0, 5))
const savingMaintenance = ref(false)
const maintenanceChanged = computed(() =>
  day.value !== (props.database.maintenance_window?.day || 'sunday')
  || hour.value !== (props.database.maintenance_window?.hour || '00:00').slice(0, 5)
)

async function saveMaintenance() {
  savingMaintenance.value = true
  await actions.updateMaintenance(props.database, day.value, hour.value)
  savingMaintenance.value = false
}

// --- Trusted sources (firewall) ---
const { rules, isPending: firewallLoading, refresh: refreshFirewall } = useDatabaseFirewall(() => props.database.id)

const ruleTypeItems = [
  { label: 'IP address', value: 'ip_addr' },
  { label: 'Droplet', value: 'droplet' },
  { label: 'Tag', value: 'tag' },
  { label: 'Kubernetes', value: 'k8s' },
  { label: 'App', value: 'app' }
]
function ruleTypeLabel(type: string) {
  return ruleTypeItems.find(i => i.value === type)?.label ?? type
}

// Editable local copy, reconciled whenever the server rules change (initial load + after save).
const localRules = ref<{ type: string, value: string }[]>([])
watch(rules, (next) => {
  localRules.value = next.map(r => ({ type: r.type, value: r.value }))
}, { immediate: true })

const newType = ref('ip_addr')
const newValue = ref('')
function addRule() {
  const value = newValue.value.trim()
  if (!value) return
  localRules.value.push({ type: newType.value, value })
  newValue.value = ''
}
function removeRule(index: number) {
  localRules.value.splice(index, 1)
}

const serverRules = computed(() => rules.value.map(r => ({ type: r.type, value: r.value })))
const firewallChanged = computed(() => JSON.stringify(localRules.value) !== JSON.stringify(serverRules.value))
const savingFirewall = ref(false)

async function saveFirewall() {
  savingFirewall.value = true
  const ok = await actions.updateFirewall(props.database, localRules.value)
  savingFirewall.value = false
  if (ok) refreshFirewall()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Plan & nodes -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-scaling"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Plan &amp; nodes
          </h3>
        </div>
      </template>

      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-sm text-highlighted font-medium">
            {{ database.size }}
          </p>
          <p class="text-sm text-muted">
            {{ specs ?? '—' }} · {{ database.num_nodes }} node{{ database.num_nodes > 1 ? 's' : '' }} · {{ formatStorage(database.storage_size_mib) }}
          </p>
        </div>
        <UButton
          label="Resize cluster"
          icon="i-lucide-scaling"
          color="neutral"
          variant="outline"
          :loading="busy"
          @click="menu.openResize(database)"
        />
      </div>
    </UCard>

    <!-- Maintenance window -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-wrench"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Maintenance window
          </h3>
        </div>
      </template>

      <p class="text-sm text-muted mb-4">
        DigitalOcean installs updates during this weekly window. Pick a low-traffic time.
      </p>

      <div class="flex flex-wrap items-end gap-3">
        <UFormField
          label="Day"
          name="day"
          class="w-40"
        >
          <USelect
            v-model="day"
            :items="dayItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Hour"
          name="hour"
          class="w-40"
        >
          <USelect
            v-model="hour"
            :items="hourItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>
        <UButton
          label="Save"
          :loading="savingMaintenance"
          :disabled="!maintenanceChanged"
          @click="saveMaintenance"
        />
      </div>
    </UCard>

    <!-- Trusted sources -->
    <UCard variant="subtle">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-shield"
              class="size-4 text-muted"
            />
            <h3 class="font-semibold text-highlighted">
              Trusted sources
            </h3>
          </div>
          <UButton
            v-if="firewallChanged"
            label="Save changes"
            size="sm"
            :loading="savingFirewall"
            @click="saveFirewall"
          />
        </div>
      </template>

      <p class="text-sm text-muted mb-4">
        Restrict inbound connections to specific sources. With no rules, the cluster accepts
        connections from anywhere (using valid credentials).
      </p>

      <!-- Loading -->
      <div
        v-if="firewallLoading && !localRules.length"
        class="space-y-2"
      >
        <USkeleton
          v-for="i in 2"
          :key="i"
          class="h-10 rounded-lg"
        />
      </div>

      <template v-else>
        <ul
          v-if="localRules.length"
          class="space-y-2 mb-4"
        >
          <li
            v-for="(rule, index) in localRules"
            :key="`${rule.type}-${rule.value}-${index}`"
            class="flex items-center gap-3 rounded-lg border border-default bg-elevated/50 px-3 py-2"
          >
            <UBadge
              color="neutral"
              variant="subtle"
              size="sm"
            >
              {{ ruleTypeLabel(rule.type) }}
            </UBadge>
            <span class="font-mono text-sm text-highlighted truncate flex-1">{{ rule.value }}</span>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              :aria-label="`Remove ${rule.value}`"
              @click="removeRule(index)"
            />
          </li>
        </ul>
        <p
          v-else
          class="text-sm text-dimmed mb-4"
        >
          No trusted sources — open to all.
        </p>

        <!-- Add a rule -->
        <div class="flex flex-wrap items-end gap-2">
          <UFormField
            label="Type"
            name="ruleType"
            class="w-36"
          >
            <USelect
              v-model="newType"
              :items="ruleTypeItems"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Value"
            name="ruleValue"
            class="flex-1 min-w-48"
          >
            <UInput
              v-model="newValue"
              placeholder="e.g. 203.0.113.0/24 or a Droplet ID"
              class="w-full"
              @keydown.enter="addRule"
            />
          </UFormField>
          <UButton
            label="Add"
            icon="i-lucide-plus"
            color="neutral"
            variant="outline"
            :disabled="!newValue.trim()"
            @click="addRule"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
