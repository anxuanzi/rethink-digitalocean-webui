<script setup lang="ts">
// Global head defaults. Page titles are set per-page via useHead/useSeoMeta.
useHead({
  htmlAttrs: { lang: 'en' },
  title: 'DigitalOcean Console',
  titleTemplate: title => (title === 'DigitalOcean Console' ? title : `${title} · DigitalOcean Console`)
})
</script>

<template>
  <!-- UApp is required for toasts, tooltips, and programmatic overlays. -->
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
