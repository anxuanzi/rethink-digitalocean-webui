<script setup lang="ts">
const name = defineModel<string>('name', { default: '' })
const tags = defineModel<string[]>('tags', { default: () => [] })

const nameValid = computed(() => name.value.trim().length > 0)
</script>

<template>
  <section class="space-y-6">
    <div>
      <div class="mb-3">
        <h2 class="text-base font-semibold text-highlighted">
          Cluster name
        </h2>
        <p class="text-sm text-muted">
          A name to identify this cluster in the console.
        </p>
      </div>
      <UFormField
        name="name"
        :error="name.length > 0 && !nameValid ? 'A name is required' : undefined"
      >
        <UInput
          v-model="name"
          placeholder="db-postgresql-prod"
          icon="i-lucide-database"
          autocomplete="off"
          class="w-full"
        />
      </UFormField>
    </div>

    <div>
      <div class="mb-3">
        <h2 class="text-base font-semibold text-highlighted">
          Tags
        </h2>
        <p class="text-sm text-muted">
          Optional labels to organize and filter your clusters.
        </p>
      </div>
      <UInputTags
        v-model="tags"
        placeholder="Add a tag and press Enter"
        icon="i-lucide-tag"
        class="w-full"
      />
    </div>
  </section>
</template>
