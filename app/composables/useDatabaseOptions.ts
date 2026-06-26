/**
 * Available engines, versions, regions, and node/size layouts for the create wizard and resize
 * modal. Keyed by team; the data is effectively static, so the cache makes it a one-time fetch.
 */
export function useDatabaseOptions() {
  const api = useDoApi()
  const auth = useDoAuthStore()

  const { state, asyncStatus } = useQuery({
    key: () => databaseKeys.options(auth.activeId),
    query: () => api.databases.options(),
    enabled: () => auth.isConnected
  })

  const options = computed(() => state.value.data?.options ?? {})
  const isPending = computed(() => asyncStatus.value === 'loading')

  return { options, isPending }
}
