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
  const { digitalOceanApiBase } = useRuntimeConfig().public

  const doFetch = $fetch.create({
    baseURL: digitalOceanApiBase,
    onRequest({ options }) {
      // Read the token reactively at request time.
      if (auth.token) {
        options.headers.set('Authorization', `Bearer ${auth.token}`)
      }
    }
  })

  return {
    provide: { doFetch }
  }
})
