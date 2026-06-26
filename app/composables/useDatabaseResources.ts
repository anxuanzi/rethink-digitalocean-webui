/**
 * Read queries for a cluster's sub-resources — connection pools, replicas, config, backups, the
 * activity log, and the engine-specific eviction policy / SQL mode / topics / indexes. Each is
 * team + cluster scoped (so switching teams refetches) and only enabled once connected.
 *
 * Callers mount these inside engine-appropriate tabs, so a query only fires when its tab is shown.
 */

export function useDatabasePools(id: MaybeRefOrGetter<string>) {
  const api = useDoApi()
  const auth = useDoAuthStore()
  const { state, asyncStatus, refresh } = useQuery({
    key: () => databaseKeys.pools(auth.activeId, toValue(id)),
    query: () => api.databases.listPools(toValue(id)),
    enabled: () => auth.isConnected && !!toValue(id)
  })
  const pools = computed(() => state.value.data?.pools ?? [])
  const isPending = computed(() => asyncStatus.value === 'loading')
  return { pools, isPending, refresh }
}

export function useDatabaseReplicas(id: MaybeRefOrGetter<string>) {
  const api = useDoApi()
  const auth = useDoAuthStore()
  const { state, asyncStatus, refresh } = useQuery({
    key: () => databaseKeys.replicas(auth.activeId, toValue(id)),
    query: () => api.databases.listReplicas(toValue(id)),
    enabled: () => auth.isConnected && !!toValue(id)
  })
  const replicas = computed(() => state.value.data?.replicas ?? [])
  const isPending = computed(() => asyncStatus.value === 'loading')
  return { replicas, isPending, refresh }
}

export function useDatabaseConfig(id: MaybeRefOrGetter<string>) {
  const api = useDoApi()
  const auth = useDoAuthStore()
  const { state, asyncStatus, refresh } = useQuery({
    key: () => databaseKeys.config(auth.activeId, toValue(id)),
    query: () => api.databases.getConfig(toValue(id)),
    enabled: () => auth.isConnected && !!toValue(id)
  })
  const config = computed(() => state.value.data?.config ?? {})
  const isPending = computed(() => asyncStatus.value === 'loading')
  return { config, isPending, refresh }
}

export function useDatabaseBackups(id: MaybeRefOrGetter<string>) {
  const api = useDoApi()
  const auth = useDoAuthStore()
  const { state, asyncStatus, refresh } = useQuery({
    key: () => databaseKeys.backups(auth.activeId, toValue(id)),
    query: () => api.databases.listBackups(toValue(id)),
    enabled: () => auth.isConnected && !!toValue(id)
  })
  const backups = computed(() => state.value.data?.backups ?? [])
  const scheduledTime = computed(() => state.value.data?.scheduled_backup_time)
  const isPending = computed(() => asyncStatus.value === 'loading')
  return { backups, scheduledTime, isPending, refresh }
}

export function useDatabaseEvents(id: MaybeRefOrGetter<string>) {
  const api = useDoApi()
  const auth = useDoAuthStore()
  const { state, asyncStatus, refresh } = useQuery({
    key: () => databaseKeys.events(auth.activeId, toValue(id)),
    query: () => api.databases.listEvents(toValue(id)),
    enabled: () => auth.isConnected && !!toValue(id)
  })
  const events = computed(() => state.value.data?.events ?? [])
  const isPending = computed(() => asyncStatus.value === 'loading')
  return { events, isPending, refresh }
}

export function useEvictionPolicy(id: MaybeRefOrGetter<string>) {
  const api = useDoApi()
  const auth = useDoAuthStore()
  const { state, asyncStatus, refresh } = useQuery({
    key: () => databaseKeys.eviction(auth.activeId, toValue(id)),
    query: () => api.databases.getEvictionPolicy(toValue(id)),
    enabled: () => auth.isConnected && !!toValue(id)
  })
  const policy = computed(() => state.value.data?.eviction_policy ?? '')
  const isPending = computed(() => asyncStatus.value === 'loading')
  return { policy, isPending, refresh }
}

export function useSqlMode(id: MaybeRefOrGetter<string>) {
  const api = useDoApi()
  const auth = useDoAuthStore()
  const { state, asyncStatus, refresh } = useQuery({
    key: () => databaseKeys.sqlMode(auth.activeId, toValue(id)),
    query: () => api.databases.getSqlMode(toValue(id)),
    enabled: () => auth.isConnected && !!toValue(id)
  })
  const sqlMode = computed(() => state.value.data?.sql_mode ?? '')
  const isPending = computed(() => asyncStatus.value === 'loading')
  return { sqlMode, isPending, refresh }
}

export function useDatabaseTopics(id: MaybeRefOrGetter<string>) {
  const api = useDoApi()
  const auth = useDoAuthStore()
  const { state, asyncStatus, refresh } = useQuery({
    key: () => databaseKeys.topics(auth.activeId, toValue(id)),
    query: () => api.databases.listTopics(toValue(id)),
    enabled: () => auth.isConnected && !!toValue(id)
  })
  const topics = computed(() => state.value.data?.topics ?? [])
  const isPending = computed(() => asyncStatus.value === 'loading')
  return { topics, isPending, refresh }
}

export function useDatabaseIndexes(id: MaybeRefOrGetter<string>) {
  const api = useDoApi()
  const auth = useDoAuthStore()
  const { state, asyncStatus, refresh } = useQuery({
    key: () => databaseKeys.indexes(auth.activeId, toValue(id)),
    query: () => api.databases.listIndexes(toValue(id)),
    enabled: () => auth.isConnected && !!toValue(id)
  })
  const indexes = computed(() => state.value.data?.indexes ?? [])
  const isPending = computed(() => asyncStatus.value === 'loading')
  return { indexes, isPending, refresh }
}
