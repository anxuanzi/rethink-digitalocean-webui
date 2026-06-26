import { FetchError } from 'ofetch'
import type {
  DatabaseCluster,
  DatabaseStatus,
  DatabasesResponse,
  DatabaseResponse,
  DatabaseResizeRequest,
  DatabasePoolCreateRequest,
  DatabaseReplicaCreateRequest,
  DatabaseTopicCreateRequest,
  DatabaseConfig
} from '~/types/database'

/**
 * Mutations for Managed Databases with optimistic UI.
 *
 * DB operations don't return a pollable `action` — the cluster moves to a transitional `status`
 * and back to `online`. So we optimistically patch the status, fire the call, then invalidate to
 * reconcile. `busy` is shared (useState) so list + detail agree on what's in flight. 401/429 are
 * handled globally by `$doFetch`. Each function resolves to a boolean so modals can stay open on
 * failure.
 */
export function useDatabaseActions() {
  const api = useDoApi()
  const auth = useDoAuthStore()
  const queryCache = useQueryCache()
  const toast = useToast()
  const busy = useState<string[]>('do-database-busy', () => [])

  const team = () => auth.activeId
  const isBusy = (id: string) => busy.value.includes(id)
  function mark(id: string) {
    if (!busy.value.includes(id)) busy.value = [...busy.value, id]
  }
  function unmark(id: string) {
    busy.value = busy.value.filter(b => b !== id)
  }

  function patchStatus(id: string, status: DatabaseStatus) {
    const listKey = databaseKeys.list(team())
    const list = queryCache.getQueryData<DatabasesResponse>(listKey)
    if (list) {
      queryCache.setQueryData(listKey, {
        ...list,
        databases: list.databases.map(d => (d.id === id ? { ...d, status } : d))
      })
    }
    const detailKey = databaseKeys.detail(team(), id)
    const detail = queryCache.getQueryData<DatabaseResponse>(detailKey)
    if (detail) queryCache.setQueryData(detailKey, { database: { ...detail.database, status } })
  }

  /**
   * Invalidate the list plus every sub-resource query for a cluster. A mutation can touch any of
   * them, and invalidation is cheap — only actively-observed queries refetch.
   */
  function invalidate(id?: string) {
    queryCache.invalidateQueries({ key: databaseKeys.list(team()) })
    if (!id) return
    const t = team()
    const keys = [
      databaseKeys.detail(t, id),
      databaseKeys.users(t, id),
      databaseKeys.dbs(t, id),
      databaseKeys.firewall(t, id),
      databaseKeys.pools(t, id),
      databaseKeys.replicas(t, id),
      databaseKeys.config(t, id),
      databaseKeys.backups(t, id),
      databaseKeys.events(t, id),
      databaseKeys.eviction(t, id),
      databaseKeys.sqlMode(t, id),
      databaseKeys.topics(t, id),
      databaseKeys.indexes(t, id)
    ]
    for (const key of keys) queryCache.invalidateQueries({ key })
  }

  /** Run a cluster mutation: mark busy → optional optimistic status → call → toast → reconcile. */
  async function run(
    id: string,
    op: () => Promise<unknown>,
    opts: { success?: string, failure?: string, optimisticStatus?: DatabaseStatus } = {}
  ): Promise<boolean> {
    mark(id)
    if (opts.optimisticStatus) patchStatus(id, opts.optimisticStatus)
    try {
      await op()
      if (opts.success) {
        toast.add({ title: opts.success, color: 'success', icon: 'i-lucide-circle-check' })
      }
      return true
    } catch (err) {
      const handledGlobally = err instanceof FetchError && (err.statusCode === 401 || err.statusCode === 429)
      if (!handledGlobally) {
        toast.add({
          title: opts.failure ?? 'Action failed',
          description: err instanceof FetchError ? (err.data?.message ?? err.statusMessage ?? undefined) : (err instanceof Error ? err.message : undefined),
          color: 'error',
          icon: 'i-lucide-alert-circle'
        })
      }
      return false
    } finally {
      unmark(id)
      invalidate(id)
    }
  }

  // --- Cluster-level ---
  const resize = (c: DatabaseCluster, body: DatabaseResizeRequest) =>
    run(c.id, () => api.databases.resize(c.id, body), { optimisticStatus: 'resizing', success: `Resizing ${c.name}…`, failure: `Could not resize ${c.name}` })

  const migrate = (c: DatabaseCluster, region: string) =>
    run(c.id, () => api.databases.migrate(c.id, { region }), { optimisticStatus: 'migrating', success: `Migrating ${c.name}…`, failure: `Could not migrate ${c.name}` })

  const updateMaintenance = (c: DatabaseCluster, day: string, hour: string) =>
    run(c.id, () => api.databases.updateMaintenance(c.id, { day, hour }), { success: 'Maintenance window updated', failure: 'Could not update the maintenance window' })

  // --- Users ---
  const createUser = (c: DatabaseCluster, name: string) =>
    run(c.id, () => api.databases.createUser(c.id, { name }), { success: `User “${name}” created`, failure: `Could not create user “${name}”` })

  const removeUser = (c: DatabaseCluster, name: string) =>
    run(c.id, () => api.databases.removeUser(c.id, name), { success: `User “${name}” deleted`, failure: `Could not delete user “${name}”` })

  const resetUserAuth = (c: DatabaseCluster, name: string) =>
    run(c.id, () => api.databases.resetUserAuth(c.id, name), { success: `Password reset for “${name}”`, failure: `Could not reset the password for “${name}”` })

  // --- Logical databases ---
  const createDb = (c: DatabaseCluster, name: string) =>
    run(c.id, () => api.databases.createDb(c.id, { name }), { success: `Database “${name}” created`, failure: `Could not create database “${name}”` })

  const removeDb = (c: DatabaseCluster, name: string) =>
    run(c.id, () => api.databases.removeDb(c.id, name), { success: `Database “${name}” deleted`, failure: `Could not delete database “${name}”` })

  // --- Trusted sources (firewall) ---
  const updateFirewall = (c: DatabaseCluster, rules: { type: string, value: string }[]) =>
    run(c.id, () => api.databases.updateFirewall(c.id, { rules }), { success: 'Trusted sources updated', failure: 'Could not update trusted sources' })

  // --- Connection pools (PostgreSQL) ---
  const createPool = (c: DatabaseCluster, body: DatabasePoolCreateRequest) =>
    run(c.id, () => api.databases.createPool(c.id, body), { success: `Pool “${body.name}” created`, failure: 'Could not create the connection pool' })
  const removePool = (c: DatabaseCluster, name: string) =>
    run(c.id, () => api.databases.removePool(c.id, name), { success: `Pool “${name}” deleted`, failure: 'Could not delete the connection pool' })

  // --- Read-only replicas ---
  const createReplica = (c: DatabaseCluster, body: DatabaseReplicaCreateRequest) =>
    run(c.id, () => api.databases.createReplica(c.id, body), { success: `Replica “${body.name}” is being created…`, failure: 'Could not create the replica' })
  const removeReplica = (c: DatabaseCluster, name: string) =>
    run(c.id, () => api.databases.removeReplica(c.id, name), { success: `Replica “${name}” deleted`, failure: 'Could not delete the replica' })
  const promoteReplica = (c: DatabaseCluster, name: string) =>
    run(c.id, () => api.databases.promoteReplica(c.id, name), { success: `Promoting “${name}” to primary…`, failure: 'Could not promote the replica' })

  // --- Engine configuration + engine-specific settings ---
  const updateConfig = (c: DatabaseCluster, config: DatabaseConfig) =>
    run(c.id, () => api.databases.updateConfig(c.id, config), { success: 'Configuration updated', failure: 'Could not update the configuration' })

  const setEvictionPolicy = (c: DatabaseCluster, policy: string) =>
    run(c.id, () => api.databases.setEvictionPolicy(c.id, policy), { success: 'Eviction policy updated', failure: 'Could not update the eviction policy' })

  const setSqlMode = (c: DatabaseCluster, mode: string) =>
    run(c.id, () => api.databases.setSqlMode(c.id, mode), { success: 'SQL mode updated', failure: 'Could not update SQL mode' })

  const createTopic = (c: DatabaseCluster, body: DatabaseTopicCreateRequest) =>
    run(c.id, () => api.databases.createTopic(c.id, body), { success: `Topic “${body.name}” created`, failure: 'Could not create the topic' })
  const removeTopic = (c: DatabaseCluster, name: string) =>
    run(c.id, () => api.databases.removeTopic(c.id, name), { success: `Topic “${name}” deleted`, failure: 'Could not delete the topic' })

  const removeIndex = (c: DatabaseCluster, name: string) =>
    run(c.id, () => api.databases.removeIndex(c.id, name), { success: `Index “${name}” deleted`, failure: 'Could not delete the index' })

  /** Destroy with optimistic removal from the list. */
  async function destroy(c: DatabaseCluster): Promise<boolean> {
    mark(c.id)
    const listKey = databaseKeys.list(team())
    const previous = queryCache.getQueryData<DatabasesResponse>(listKey)
    if (previous) {
      queryCache.setQueryData(listKey, {
        ...previous,
        databases: previous.databases.filter(x => x.id !== c.id),
        meta: { ...previous.meta, total: Math.max(0, (previous.meta?.total ?? 1) - 1) }
      })
    }
    try {
      await api.databases.remove(c.id)
      toast.add({ title: `Destroyed ${c.name}`, color: 'success', icon: 'i-lucide-circle-check' })
      return true
    } catch (err) {
      if (previous) queryCache.setQueryData(listKey, previous)
      const handledGlobally = err instanceof FetchError && (err.statusCode === 401 || err.statusCode === 429)
      if (!handledGlobally) {
        toast.add({ title: `Could not destroy ${c.name}`, color: 'error', icon: 'i-lucide-alert-circle' })
      }
      return false
    } finally {
      unmark(c.id)
      invalidate()
    }
  }

  return {
    isBusy,
    resize,
    migrate,
    updateMaintenance,
    createUser,
    removeUser,
    resetUserAuth,
    createDb,
    removeDb,
    updateFirewall,
    createPool,
    removePool,
    createReplica,
    removeReplica,
    promoteReplica,
    updateConfig,
    setEvictionPolicy,
    setSqlMode,
    createTopic,
    removeTopic,
    removeIndex,
    destroy
  }
}
