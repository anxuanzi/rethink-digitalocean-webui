/**
 * The Droplet list query. Fetches up to 200 Droplets in one page so search/filter/sort can
 * run instantly client-side (most accounts are well under that; pagination kicks in beyond it).
 * Keyed by the active team so switching teams yields fresh data.
 */
export function useDroplets() {
  const api = useDoApi()
  const auth = useDoAuthStore()

  const { state, asyncStatus, refresh } = useQuery({
    key: () => dropletKeys.list(auth.activeId),
    query: () => api.droplets.list(1, 200),
    enabled: () => auth.isConnected
  })

  const droplets = computed(() => state.value.data?.droplets ?? [])
  const total = computed(() => state.value.data?.meta?.total ?? droplets.value.length)
  const isPending = computed(() => asyncStatus.value === 'loading')
  const error = computed(() => state.value.error)

  return { droplets, total, isPending, error, refresh }
}

/** Single Droplet query for the detail page. */
export function useDroplet(id: MaybeRefOrGetter<number>) {
  const api = useDoApi()
  const auth = useDoAuthStore()

  const { state, asyncStatus, refresh } = useQuery({
    key: () => dropletKeys.detail(auth.activeId, toValue(id)),
    query: () => api.droplets.get(toValue(id)),
    enabled: () => auth.isConnected
  })

  const droplet = computed(() => state.value.data?.droplet)
  const isPending = computed(() => asyncStatus.value === 'loading')
  const error = computed(() => state.value.error)

  return { droplet, isPending, error, refresh }
}
