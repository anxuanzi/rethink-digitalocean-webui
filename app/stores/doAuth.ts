import type { SavedToken } from '~/types/auth'
import type { DoAccount } from '~/types/digitalocean'

/**
 * Client-held DigitalOcean tokens — one per team.
 *
 * Each DO Personal Access Token is scoped to a single team, so "teams" are really a list of
 * saved tokens with one marked active. The active token feeds `$doFetch` (via the `token`
 * getter). Everything lives only in this browser (localStorage); nothing is sent anywhere
 * except, per request, to the DigitalOcean API itself.
 *
 * This store is pure state — side effects (verifying tokens, clearing the query cache on
 * switch, navigation, toasts) live in the `useDoAuth()` composable.
 */
export const useDoAuthStore = defineStore('do-auth', () => {
  const tokens = ref<SavedToken[]>([])
  const activeId = ref<string | null>(null)

  const activeToken = computed(() => tokens.value.find(t => t.id === activeId.value))
  /** The active token string — `$doFetch` reads this, so the plugin needs no changes. */
  const token = computed(() => activeToken.value?.token ?? '')
  const isConnected = computed(() => !!activeToken.value)

  /**
   * Add a token from a verified account lookup, or update the existing entry for that team.
   * Dedupes by team UUID (falling back to an exact token match). Returns the saved entry.
   */
  function addToken(rawToken: string, account: DoAccount, label?: string): SavedToken {
    const value = rawToken.trim()
    const teamUuid = account.team?.uuid ?? null
    const teamName = account.team?.name ?? null

    const existing = tokens.value.find(t =>
      (teamUuid && t.teamUuid === teamUuid) || t.token === value
    )
    if (existing) {
      existing.token = value
      existing.accountEmail = account.email
      existing.teamUuid = teamUuid
      existing.teamName = teamName
      if (label?.trim()) existing.label = label.trim()
      activeId.value = existing.id
      return existing
    }

    const entry: SavedToken = {
      id: crypto.randomUUID(),
      label: label?.trim() || teamName || account.email,
      token: value,
      accountEmail: account.email,
      teamUuid,
      teamName,
      addedAt: new Date().toISOString()
    }
    tokens.value.push(entry)
    // First token added becomes active automatically.
    if (!activeId.value) activeId.value = entry.id
    return entry
  }

  /** Refresh the active token's cached account info (after re-verifying it on load). */
  function updateActiveAccount(account: DoAccount) {
    const entry = activeToken.value
    if (!entry) return
    entry.accountEmail = account.email
    entry.teamUuid = account.team?.uuid ?? null
    entry.teamName = account.team?.name ?? null
  }

  function removeToken(id: string) {
    const index = tokens.value.findIndex(t => t.id === id)
    if (index === -1) return
    tokens.value.splice(index, 1)
    if (activeId.value === id) {
      activeId.value = tokens.value[0]?.id ?? null
    }
  }

  function renameToken(id: string, label: string) {
    const entry = tokens.value.find(t => t.id === id)
    if (entry && label.trim()) entry.label = label.trim()
  }

  function setActive(id: string) {
    if (tokens.value.some(t => t.id === id)) activeId.value = id
  }

  function clearAll() {
    tokens.value = []
    activeId.value = null
  }

  return {
    tokens,
    activeId,
    activeToken,
    token,
    isConnected,
    addToken,
    updateActiveAccount,
    removeToken,
    renameToken,
    setActive,
    clearAll
  }
}, {
  // Persist the list + active id to localStorage (configured globally in nuxt.config).
  persist: {
    pick: ['tokens', 'activeId']
  }
})
