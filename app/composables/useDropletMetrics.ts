import type { MetricsResponse } from '~/types/droplet'

export type ChartPoint = { t: number, [series: string]: number }

/** Parse one Prometheus matrix series into [ms, number] pairs. */
function toPairs(res: MetricsResponse, seriesIndex = 0): [number, number][] {
  const series = res.data?.result?.[seriesIndex]
  if (!series) return []
  return series.values.map(([ts, v]) => [ts * 1000, Number(v)])
}

/** Merge named [ms, value] series into chart rows keyed by timestamp. */
function merge(named: Record<string, [number, number][]>): ChartPoint[] {
  const byTs = new Map<number, ChartPoint>()
  for (const [name, pairs] of Object.entries(named)) {
    for (const [t, v] of pairs) {
      const row = byTs.get(t) ?? { t }
      row[name] = v
      byTs.set(t, row)
    }
  }
  return [...byTs.values()].sort((a, b) => a.t - b.t)
}

/**
 * Droplet monitoring metrics, parsed into chart-ready rows. Requires the DigitalOcean
 * monitoring agent on the Droplet; otherwise the series come back empty (handled by the UI).
 */
export function useDropletMetrics(dropletId: MaybeRefOrGetter<number>, rangeHours: MaybeRefOrGetter<number>) {
  const api = useDoApi()
  const auth = useDoAuthStore()

  const window = () => {
    const end = Math.floor(Date.now() / 1000)
    return {
      host_id: String(toValue(dropletId)),
      start: String(end - toValue(rangeHours) * 3600),
      end: String(end)
    }
  }
  const rangeKey = () => `${toValue(rangeHours)}h`
  const enabled = () => auth.isConnected

  const bandwidth = useQuery({
    key: () => dropletKeys.metrics(auth.activeId, toValue(dropletId), 'bandwidth', rangeKey()),
    enabled,
    query: async () => {
      const q = window()
      const [inbound, outbound] = await Promise.all([
        api.monitoring.metric('bandwidth', { ...q, interface: 'public', direction: 'inbound' }),
        api.monitoring.metric('bandwidth', { ...q, interface: 'public', direction: 'outbound' })
      ])
      return merge({ Inbound: toPairs(inbound), Outbound: toPairs(outbound) })
    }
  })

  const memory = useQuery({
    key: () => dropletKeys.metrics(auth.activeId, toValue(dropletId), 'memory', rangeKey()),
    enabled,
    query: async () => {
      const q = window()
      const [total, available] = await Promise.all([
        api.monitoring.metric('memory_total', q),
        api.monitoring.metric('memory_available', q)
      ])
      const totalPairs = toPairs(total)
      const availPairs = toPairs(available)
      const used: [number, number][] = totalPairs.map(([t, tot], i) => {
        const avail = availPairs[i]?.[1] ?? 0
        const pct = tot > 0 ? ((tot - avail) / tot) * 100 : 0
        return [t, Math.max(0, Math.min(100, pct))]
      })
      return merge({ Used: used })
    }
  })

  const cpu = useQuery({
    key: () => dropletKeys.metrics(auth.activeId, toValue(dropletId), 'cpu', rangeKey()),
    enabled,
    query: async () => {
      const res = await api.monitoring.metric('cpu', window())
      // /cpu reports cumulative seconds per mode; derive usage% from the per-interval delta
      // of non-idle time over total time.
      const modeSeries = new Map<string, [number, number][]>()
      for (const series of res.data?.result ?? []) {
        const mode = series.metric?.mode ?? 'unknown'
        modeSeries.set(mode, series.values.map(([ts, v]) => [ts * 1000, Number(v)]))
      }
      const idle = modeSeries.get('idle') ?? []
      const points: [number, number][] = []
      for (let i = 1; i < idle.length; i++) {
        let totalDelta = 0
        let idleDelta = 0
        for (const [mode, vals] of modeSeries) {
          const delta = (vals[i]?.[1] ?? 0) - (vals[i - 1]?.[1] ?? 0)
          totalDelta += delta
          if (mode === 'idle') idleDelta += delta
        }
        const pct = totalDelta > 0 ? (1 - idleDelta / totalDelta) * 100 : 0
        points.push([idle[i]?.[0] ?? 0, Math.max(0, Math.min(100, pct))])
      }
      return merge({ CPU: points })
    }
  })

  return { bandwidth, memory, cpu }
}
