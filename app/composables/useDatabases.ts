/**
 * Managed Database reads (Pinia Colada), team-scoped so switching teams refetches.
 *
 * The cluster detail (GET /databases/{id}) already embeds `users`, `db_names`, and the
 * `connection` credentials, so the Users/Databases/Connection tabs read straight off it — no
 * extra requests. Trusted sources (firewall) are not in the cluster object, hence a separate query.
 */
export function useDatabases() {
  const api = useDoApi()
  const auth = useDoAuthStore()

  const { state, asyncStatus, refresh } = useQuery({
    key: () => databaseKeys.list(auth.activeId),
    query: () => api.databases.list(1, 200),
    enabled: () => auth.isConnected
  })

  const databases = computed(() => state.value.data?.databases ?? [])
  const total = computed(() => state.value.data?.meta?.total ?? databases.value.length)
  const isPending = computed(() => asyncStatus.value === 'loading')
  const error = computed(() => state.value.error)

  return { databases, total, isPending, error, refresh }
}

/** Single cluster — the source of truth for the detail page (specs, users, dbs, connection). */
export function useDatabase(id: MaybeRefOrGetter<string>) {
  const api = useDoApi()
  const auth = useDoAuthStore()

  const { state, asyncStatus, refresh } = useQuery({
    key: () => databaseKeys.detail(auth.activeId, toValue(id)),
    query: () => api.databases.get(toValue(id)),
    enabled: () => auth.isConnected && !!toValue(id)
  })

  const database = computed(() => state.value.data?.database)
  const isPending = computed(() => asyncStatus.value === 'loading')
  const error = computed(() => state.value.error)

  return { database, isPending, error, refresh }
}

/** Trusted sources (firewall rules) for a cluster — separate endpoint from the cluster object. */
export function useDatabaseFirewall(id: MaybeRefOrGetter<string>) {
  const api = useDoApi()
  const auth = useDoAuthStore()

  const { state, asyncStatus, refresh } = useQuery({
    key: () => databaseKeys.firewall(auth.activeId, toValue(id)),
    query: () => api.databases.getFirewall(toValue(id)),
    enabled: () => auth.isConnected && !!toValue(id)
  })

  const rules = computed(() => state.value.data?.rules ?? [])
  const isPending = computed(() => asyncStatus.value === 'loading')
  const error = computed(() => state.value.error)

  return { rules, isPending, error, refresh }
}

/**
 * Database users from the dedicated endpoint. The cluster object embeds `users` for some engines
 * (PostgreSQL) but returns null for others (MongoDB), so we always read from `/users` here.
 */
export function useDatabaseUsers(id: MaybeRefOrGetter<string>) {
  const api = useDoApi()
  const auth = useDoAuthStore()

  const { state, asyncStatus, refresh } = useQuery({
    key: () => databaseKeys.users(auth.activeId, toValue(id)),
    query: () => api.databases.listUsers(toValue(id)),
    enabled: () => auth.isConnected && !!toValue(id)
  })

  const users = computed(() => state.value.data?.users ?? [])
  const isPending = computed(() => asyncStatus.value === 'loading')
  return { users, isPending, refresh }
}

/** Logical databases from the dedicated `/dbs` endpoint (same engine caveat as users). */
export function useDatabaseDbs(id: MaybeRefOrGetter<string>) {
  const api = useDoApi()
  const auth = useDoAuthStore()

  const { state, asyncStatus, refresh } = useQuery({
    key: () => databaseKeys.dbs(auth.activeId, toValue(id)),
    query: () => api.databases.listDbs(toValue(id)),
    enabled: () => auth.isConnected && !!toValue(id)
  })

  const dbs = computed(() => state.value.data?.dbs ?? [])
  const isPending = computed(() => asyncStatus.value === 'loading')
  return { dbs, isPending, refresh }
}
