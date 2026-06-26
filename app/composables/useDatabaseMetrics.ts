import type { MetricsResponse } from '~/types/droplet'
import type { ChartPoint } from '~/composables/useDropletMetrics'

/** Parse one Prometheus matrix series into chart rows under `key`. */
function parseSeries(res: MetricsResponse, key: string): ChartPoint[] {
  const series = res.data?.result?.[0]
  if (!series) return []
  return series.values.map(([ts, v]) => ({ t: ts * 1000, [key]: Number(v) }))
}

/**
 * MySQL performance metrics (CPU, memory, disk). DigitalOcean only exposes managed-database
 * metrics for MySQL via the public monitoring API, so the queries are gated by `isEnabled` — the
 * Metrics tab passes a getter that's true only for MySQL clusters.
 */
export function useDatabaseMetrics(
  id: MaybeRefOrGetter<string>,
  rangeHours: MaybeRefOrGetter<number>,
  isEnabled: () => boolean
) {
  const api = useDoApi()
  const auth = useDoAuthStore()

  const win = () => {
    const end = Math.floor(Date.now() / 1000)
    return {
      db_id: toValue(id),
      start: String(end - toValue(rangeHours) * 3600),
      end: String(end),
      aggregate: 'avg'
    }
  }
  const rangeKey = () => `${toValue(rangeHours)}h`
  const enabled = () => auth.isConnected && !!toValue(id) && isEnabled()

  const cpu = useQuery({
    key: () => databaseKeys.metrics(auth.activeId, toValue(id), 'cpu', rangeKey()),
    enabled,
    query: async () => parseSeries(await api.databases.mysqlMetric('cpu_usage', win()), 'CPU')
  })
  const memory = useQuery({
    key: () => databaseKeys.metrics(auth.activeId, toValue(id), 'memory', rangeKey()),
    enabled,
    query: async () => parseSeries(await api.databases.mysqlMetric('memory_usage', win()), 'Memory')
  })
  const disk = useQuery({
    key: () => databaseKeys.metrics(auth.activeId, toValue(id), 'disk', rangeKey()),
    enabled,
    query: async () => parseSeries(await api.databases.mysqlMetric('disk_usage', win()), 'Disk')
  })

  const cpuData = computed(() => cpu.state.value.data ?? [])
  const memoryData = computed(() => memory.state.value.data ?? [])
  const diskData = computed(() => disk.state.value.data ?? [])
  const isPending = computed(() =>
    cpu.asyncStatus.value === 'loading' || memory.asyncStatus.value === 'loading' || disk.asyncStatus.value === 'loading'
  )

  return { cpuData, memoryData, diskData, isPending }
}
