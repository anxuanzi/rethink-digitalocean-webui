// https://nuxt.com/docs/api/configuration/nuxt-config
import process from 'node:process'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@pinia-plugin-persistedstate/nuxt'
  ],

  // Pure client-side SPA — no server runtime. The DigitalOcean API supports CORS, so the
  // browser talks to it directly and the whole app deploys as static files (e.g. GitHub Pages).
  ssr: false,

  devtools: {
    enabled: true
  },

  app: {
    // GitHub Pages serves a project site under a subpath. CI sets NUXT_APP_BASE_URL
    // (e.g. '/rethink-digitalocean-webui/'); local dev defaults to '/'.
    baseURL: process.env.NUXT_APP_BASE_URL || '/'
  },

  css: ['~/assets/css/main.css'],

  // Theme via @nuxtjs/color-mode (registered by @nuxt/ui). Follows the OS by default,
  // switchable at runtime; empty classSuffix keeps the `.dark` class Tailwind expects.
  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'dark'
  },

  runtimeConfig: {
    public: {
      // Calls go straight from the browser to the DigitalOcean API.
      digitalOceanApiBase: 'https://api.digitalocean.com/v2'
    }
  },

  compatibilityDate: '2025-01-01',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  piniaPersistedstate: {
    storage: 'localStorage'
  }
})
