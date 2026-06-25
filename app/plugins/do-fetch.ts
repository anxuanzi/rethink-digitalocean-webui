/**
 * Provides `$doFetch` — our own typed HTTP client for the DigitalOcean API.
 *
 * The DigitalOcean API supports CORS, so the browser calls it directly: no server, no proxy.
 * The client-held token is attached as a Bearer header per request and never leaves the
 * browser except to api.digitalocean.com over HTTPS. Use it via `useNuxtApp().$doFetch`
 * (usually wrapped by the typed `useDoApi()` composable).
 */
export default defineNuxtPlugin(() => {
  const auth = useDoAuthStore()
  const toast = useToast()
  const { digitalOceanApiBase } = useRuntimeConfig().public

  const doFetch = $fetch.create({
    baseURL: digitalOceanApiBase,
    onRequest({ options }) {
      // Read the token reactively at request time.
      if (auth.token) {
        options.headers.set('Authorization', `Bearer ${auth.token}`)
      }
    },
    // Shared handling for every active-token call (resource fetches + mutations).
    // The `id` on each toast dedupes bursts of failures into a single notification.
    onResponseError({ response }) {
      if (response.status === 401) {
        toast.add({
          id: 'do-auth-error',
          title: 'Could not authenticate with DigitalOcean',
          description: 'Your token may be invalid or revoked. Re-add it to continue.',
          color: 'error',
          icon: 'i-lucide-shield-alert'
        })
        navigateTo('/settings/teams')
      } else if (response.status === 429) {
        toast.add({
          id: 'do-rate-limit',
          title: 'Rate limit reached',
          description: 'DigitalOcean is throttling requests — try again shortly.',
          color: 'warning',
          icon: 'i-lucide-alert-triangle'
        })
      }
    }
  })

  return {
    provide: { doFetch }
  }
})
