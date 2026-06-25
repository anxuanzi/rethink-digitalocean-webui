/**
 * Client-held DigitalOcean Personal Access Token (PAT).
 *
 * The token lives ONLY in the browser (localStorage). It is never sent anywhere except,
 * per-request, to our own stateless proxy, which forwards it to DigitalOcean and forgets it.
 */
export const useDoAuthStore = defineStore('do-auth', () => {
  const token = ref('')

  const isConnected = computed(() => token.value.length > 0)

  function connect(pat: string) {
    token.value = pat.trim()
  }

  function disconnect() {
    token.value = ''
  }

  return { token, isConnected, connect, disconnect }
}, {
  // Persist only the token. Storage is set to localStorage globally in nuxt.config
  // (@pinia-plugin-persistedstate), so the token is never auto-sent to a server as a cookie.
  persist: {
    pick: ['token']
  }
})
