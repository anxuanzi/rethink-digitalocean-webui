import type { DatabaseEngine, DatabaseStatus } from '~/types/database'

/** Presentation helpers for Managed Databases: engine branding, status, sizing, regions. */

interface EngineMeta {
  label: string
  /** Brand logo where one exists (simple-icons), else a neutral fallback. */
  icon: string
  /** Tinted icon-tile classes — semantic tokens only, loosely echoing each brand's hue. */
  tint: string
}

const ENGINE_META: Record<string, EngineMeta> = {
  pg: { label: 'PostgreSQL', icon: 'i-simple-icons-postgresql', tint: 'bg-info/10 text-info' },
  mysql: { label: 'MySQL', icon: 'i-simple-icons-mysql', tint: 'bg-primary/10 text-primary' },
  redis: { label: 'Redis', icon: 'i-simple-icons-redis', tint: 'bg-error/10 text-error' },
  valkey: { label: 'Valkey', icon: 'i-lucide-database', tint: 'bg-error/10 text-error' },
  mongodb: { label: 'MongoDB', icon: 'i-simple-icons-mongodb', tint: 'bg-success/10 text-success' },
  kafka: { label: 'Kafka', icon: 'i-simple-icons-apachekafka', tint: 'bg-elevated text-muted' },
  opensearch: { label: 'OpenSearch', icon: 'i-simple-icons-opensearch', tint: 'bg-warning/10 text-warning' }
}

export function engineMeta(engine: string): EngineMeta {
  return ENGINE_META[engine] ?? { label: engine || 'Database', icon: 'i-lucide-database', tint: 'bg-elevated text-muted' }
}

/** Engines we let users provision, in a sensible display order. */
export const databaseEngineOrder: DatabaseEngine[] = ['pg', 'mysql', 'redis', 'valkey', 'mongodb', 'kafka', 'opensearch']

interface DbStatusMeta {
  label: string
  color: 'success' | 'neutral' | 'warning' | 'error' | 'info'
  icon: string
  /** Transitional states spin their icon. */
  pulse?: boolean
}

const STATUS_META: Record<string, DbStatusMeta> = {
  online: { label: 'Online', color: 'success', icon: 'i-lucide-circle-check' },
  creating: { label: 'Creating', color: 'warning', icon: 'i-lucide-loader', pulse: true },
  resizing: { label: 'Resizing', color: 'warning', icon: 'i-lucide-loader', pulse: true },
  migrating: { label: 'Migrating', color: 'warning', icon: 'i-lucide-loader', pulse: true },
  forking: { label: 'Forking', color: 'warning', icon: 'i-lucide-loader', pulse: true }
}

export function databaseStatusMeta(status: DatabaseStatus): DbStatusMeta {
  return STATUS_META[status] ?? { label: status || 'Unknown', color: 'neutral', icon: 'i-lucide-circle-help' }
}

/** Parse vCPU/RAM out of a DB size slug like `db-s-2vcpu-4gb` → "2 vCPU · 4 GB RAM". */
export function databaseSizeSpecs(slug?: string): string | null {
  if (!slug) return null
  const match = slug.match(/(\d+)vcpu-(\d+)gb/i)
  return match ? `${match[1]} vCPU · ${match[2]} GB RAM` : null
}

/** Disk size from mebibytes → human GB/TB. */
export function formatStorage(mib?: number): string {
  if (!mib) return '—'
  const gib = mib / 1024
  return gib >= 1024 ? `${(gib / 1024).toFixed(gib % 1024 === 0 ? 0 : 1)} TB` : `${Math.round(gib)} GB`
}

/**
 * DB cluster objects carry only a region slug (no friendly name). DigitalOcean's regions are
 * stable, so a static map avoids an extra `/regions` request on every database view.
 */
const REGION_NAMES: Record<string, string> = {
  nyc1: 'New York 1', nyc2: 'New York 2', nyc3: 'New York 3',
  sfo1: 'San Francisco 1', sfo2: 'San Francisco 2', sfo3: 'San Francisco 3',
  ams2: 'Amsterdam 2', ams3: 'Amsterdam 3',
  sgp1: 'Singapore 1', lon1: 'London 1', fra1: 'Frankfurt 1',
  tor1: 'Toronto 1', blr1: 'Bangalore 1', syd1: 'Sydney 1', atl1: 'Atlanta 1'
}

export function regionName(slug?: string): string {
  if (!slug) return '—'
  return REGION_NAMES[slug] ?? slug
}
