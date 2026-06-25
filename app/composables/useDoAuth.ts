import type { SavedToken } from '~/types/auth'

/**
 * Auth orchestration: the side-effectful layer on top of `useDoAuthStore`.
 *
 * Verifies and adds tokens (with a toast), re-checks the active token on load, switches the
 * active team (clearing the Pinia Colada cache so the previous team's data never lingers, then
 * returning to the dashboard), and removes teams. Keeping these effects here keeps the store pure.
 */
export function useDoAuth() {
  const store = useDoAuthStore()
  const api = useDoApi()
  const queryCache = useQueryCache()
  const toast = useToast()

  /** Fully reset the query cache (cancel in-flight, then drop every entry). */
  function clearCache() {
    queryCache.cancelQueries()
    for (const entry of queryCache.getEntries()) queryCache.remove(entry)
  }

  /** Verify a raw token against GET /v2/account, then save it. Throws (FetchError) if invalid. */
  async function addToken(rawToken: string, label?: string): Promise<SavedToken> {
    const { account } = await api.account.verify(rawToken)
    const isUpdate = store.tokens.some(
      t => account.team?.uuid && t.teamUuid === account.team.uuid
    )
    const entry = store.addToken(rawToken, account, label)
    toast.add({
      title: isUpdate ? `Updated ${entry.label}` : `Connected ${entry.label}`,
      description: account.email,
      color: 'success',
      icon: 'i-lucide-circle-check'
    })
    return entry
  }

  /**
   * Re-verify the active token on app load and refresh its cached account info. A revoked
   * token surfaces here via $doFetch's global 401 handler; transient errors are ignored.
   */
  async function refreshActive() {
    if (!store.isConnected) return
    try {
      const { account } = await api.account.get()
      store.updateActiveAccount(account)
    } catch {
      // 401 / network errors are handled globally by $doFetch's onResponseError.
    }
  }

  /** Switch the active team: reset cached data and return to the dashboard for a clean context. */
  async function switchTeam(id: string) {
    if (id === store.activeId) return
    store.setActive(id)
    clearCache()
    await navigateTo('/')
  }

  /** Remove a team. If it was active, reset the cache; if it was the last one, go to onboarding. */
  async function removeTeam(id: string) {
    const wasActive = store.activeId === id
    store.removeToken(id)
    if (wasActive) clearCache()
    if (!store.isConnected) await navigateTo('/connect')
  }

  return { addToken, refreshActive, switchTeam, removeTeam }
}
