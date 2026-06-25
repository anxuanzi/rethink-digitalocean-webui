<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()

// Clear the error and return to the dashboard.
function handleError() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <!-- error.vue renders outside the app tree, so it needs its own UApp wrapper. -->
  <UApp>
    <div class="min-h-screen flex items-center justify-center p-6">
      <div class="text-center space-y-4 max-w-sm">
        <UIcon
          name="i-lucide-triangle-alert"
          class="size-12 text-warning mx-auto"
        />
        <h1 class="text-3xl font-semibold text-highlighted">
          {{ error.statusCode }}
        </h1>
        <p class="text-muted">
          {{ error.message || 'Something went wrong.' }}
        </p>
        <UButton
          label="Back to dashboard"
          icon="i-lucide-arrow-left"
          @click="handleError"
        />
      </div>
    </div>
  </UApp>
</template>
