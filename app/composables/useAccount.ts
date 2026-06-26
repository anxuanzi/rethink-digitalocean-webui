/**
 * Live account info (email, status, resource limits) for the active team. Backed by Pinia
 * Colada and keyed by team, so switching teams refetches. Complements the lightweight account
 * snapshot cached in the auth store (which only holds email/team for the token list).
 */
export function useAccount() {
  const api = useDoApi()
  const auth = useDoAuthStore()

  const { state, asyncStatus, refresh } = useQuery({
    key: () => accountKeys.detail(auth.activeId),
    query: async () => (await api.account.get()).account,
    enabled: () => auth.isConnected
  })

  const account = computed(() => state.value.data)
  const isPending = computed(() => asyncStatus.value === 'loading')
  const error = computed(() => state.value.error)

  return { account, isPending, error, refresh }
}
