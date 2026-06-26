import { FetchError } from 'ofetch'
import type { Droplet, DropletStatus, DropletActionBody, DropletsResponse } from '~/types/droplet'

/**
 * Optimistic Droplet actions with async-action polling.
 *
 * Every action: marks the Droplet busy, optimistically patches its status in the cache (where
 * sensible), fires the API call, polls the returned async action to completion, then invalidates
 * to pull real state. Errors roll back via invalidation; 401/429 are handled globally by $doFetch.
 *
 * `busy` is shared (useState) so the list and detail views both reflect in-flight actions.
 */
export function useDropletActions() {
  const api = useDoApi()
  const auth = useDoAuthStore()
  const queryCache = useQueryCache()
  const toast = useToast()
  const busy = useState<number[]>('do-droplet-busy', () => [])

  const team = () => auth.activeId
  const isBusy = (id: number) => busy.value.includes(id)
  function mark(id: number) {
    if (!busy.value.includes(id)) busy.value = [...busy.value, id]
  }
  function unmark(id: number) {
    busy.value = busy.value.filter(b => b !== id)
  }

  function patchStatus(id: number, status: DropletStatus) {
    const listKey = dropletKeys.list(team())
    const list = queryCache.getQueryData<DropletsResponse>(listKey)
    if (list) {
      queryCache.setQueryData(listKey, {
        ...list,
        droplets: list.droplets.map(d => (d.id === id ? { ...d, status } : d))
      })
    }
    const detailKey = dropletKeys.detail(team(), id)
    const detail = queryCache.getQueryData<{ droplet: Droplet }>(detailKey)
    if (detail) queryCache.setQueryData(detailKey, { droplet: { ...detail.droplet, status } })
  }

  function invalidate(id?: number) {
    queryCache.invalidateQueries({ key: dropletKeys.list(team()) })
    if (id != null) queryCache.invalidateQueries({ key: dropletKeys.detail(team(), id) })
  }

  /** Poll an async action until it settles. */
  async function pollAction(dropletId: number, actionId: number, timeoutMs = 180_000) {
    const start = performance.now()
    while (performance.now() - start < timeoutMs) {
      const { action } = await api.droplets.getAction(dropletId, actionId)
      if (action.status === 'completed') return
      if (action.status === 'errored') throw new Error('DigitalOcean reported the action failed')
      await new Promise(resolve => setTimeout(resolve, 2500))
    }
    throw new Error('Timed out waiting for the action to complete')
  }

  async function runAction(
    droplet: Droplet,
    body: DropletActionBody,
    opts: { optimisticStatus?: DropletStatus, success?: string } = {}
  ) {
    mark(droplet.id)
    if (opts.optimisticStatus) patchStatus(droplet.id, opts.optimisticStatus)
    try {
      const { action } = await api.droplets.action(droplet.id, body)
      await pollAction(droplet.id, action.id)
      if (opts.success) {
        toast.add({ title: opts.success, color: 'success', icon: 'i-lucide-circle-check' })
      }
      invalidate(droplet.id)
    } catch (err) {
      invalidate(droplet.id) // pull real state back after a failed/rolled-back action
      const handledGlobally = err instanceof FetchError && (err.statusCode === 401 || err.statusCode === 429)
      if (!handledGlobally) {
        toast.add({
          title: 'Action failed',
          description: err instanceof Error ? err.message : undefined,
          color: 'error',
          icon: 'i-lucide-alert-circle'
        })
      }
    } finally {
      unmark(droplet.id)
    }
  }

  // --- Power ---
  const powerOn = (d: Droplet) => runAction(d, { type: 'power_on' }, { optimisticStatus: 'active', success: `Powered on ${d.name}` })
  const powerOff = (d: Droplet) => runAction(d, { type: 'power_off' }, { optimisticStatus: 'off', success: `Powered off ${d.name}` })
  const shutdown = (d: Droplet) => runAction(d, { type: 'shutdown' }, { optimisticStatus: 'off', success: `Shut down ${d.name}` })
  const reboot = (d: Droplet) => runAction(d, { type: 'reboot' }, { success: `Rebooted ${d.name}` })
  const powerCycle = (d: Droplet) => runAction(d, { type: 'power_cycle' }, { success: `Power-cycled ${d.name}` })

  // --- Modify ---
  const snapshot = (d: Droplet, name: string) => runAction(d, { type: 'snapshot', name }, { success: `Snapshot of ${d.name} started` })
  const resize = (d: Droplet, size: string, disk: boolean) => runAction(d, { type: 'resize', size, disk }, { optimisticStatus: 'off', success: `Resized ${d.name}` })
  const rebuild = (d: Droplet, image: number | string) => runAction(d, { type: 'rebuild', image }, { success: `Rebuilt ${d.name}` })
  const rename = (d: Droplet, name: string) => runAction(d, { type: 'rename', name }, { success: `Renamed to ${name}` })
  const enableBackups = (d: Droplet) => runAction(d, { type: 'enable_backups' }, { success: `Backups enabled for ${d.name}` })
  const disableBackups = (d: Droplet) => runAction(d, { type: 'disable_backups' }, { success: `Backups disabled for ${d.name}` })
  const enableIpv6 = (d: Droplet) => runAction(d, { type: 'enable_ipv6' }, { success: `IPv6 enabled for ${d.name}` })

  /** Destroy with optimistic removal from the list. */
  async function destroy(d: Droplet) {
    mark(d.id)
    const listKey = dropletKeys.list(team())
    const previous = queryCache.getQueryData<DropletsResponse>(listKey)
    if (previous) {
      queryCache.setQueryData(listKey, {
        ...previous,
        droplets: previous.droplets.filter(x => x.id !== d.id),
        meta: { ...previous.meta, total: Math.max(0, (previous.meta?.total ?? 1) - 1) }
      })
    }
    try {
      await api.droplets.remove(d.id)
      toast.add({ title: `Destroyed ${d.name}`, color: 'success', icon: 'i-lucide-circle-check' })
    } catch (err) {
      if (previous) queryCache.setQueryData(listKey, previous) // rollback
      const handledGlobally = err instanceof FetchError && (err.statusCode === 401 || err.statusCode === 429)
      if (!handledGlobally) {
        toast.add({ title: `Could not destroy ${d.name}`, color: 'error', icon: 'i-lucide-alert-circle' })
      }
    } finally {
      unmark(d.id)
      invalidate()
    }
  }

  // --- Bulk (loops per id; selection is by id, not tag) ---
  async function bulkAction(droplets: Droplet[], body: DropletActionBody, opts: { optimisticStatus?: DropletStatus, label?: string } = {}) {
    if (!droplets.length) return
    await Promise.allSettled(droplets.map(d => runAction(d, body, { optimisticStatus: opts.optimisticStatus })))
    toast.add({
      title: `${opts.label ?? 'Done'} · ${droplets.length} Droplet${droplets.length > 1 ? 's' : ''}`,
      color: 'success',
      icon: 'i-lucide-circle-check'
    })
  }
  async function bulkDestroy(droplets: Droplet[]) {
    if (!droplets.length) return
    await Promise.allSettled(droplets.map(d => destroy(d)))
  }

  return {
    isBusy,
    runAction,
    powerOn,
    powerOff,
    shutdown,
    reboot,
    powerCycle,
    snapshot,
    resize,
    rebuild,
    rename,
    enableBackups,
    disableBackups,
    enableIpv6,
    destroy,
    bulkAction,
    bulkDestroy
  }
}
