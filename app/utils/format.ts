import type { Droplet, DropletStatus } from '~/types/droplet'

/** Formatting helpers for Droplet specs, pricing, and status. */

export function formatMemory(mb?: number): string {
  if (!mb) return '—'
  return mb >= 1024 ? `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB` : `${mb} MB`
}

export function formatDisk(gb?: number): string {
  if (!gb) return '—'
  return gb >= 1000 ? `${(gb / 1000).toFixed(1)} TB` : `${gb} GB`
}

export function formatPrice(monthly?: number): string {
  if (monthly == null) return '—'
  return `$${monthly % 1 === 0 ? monthly : monthly.toFixed(2)}`
}

export function dropletPublicIp(droplet: Droplet): string | null {
  return droplet.networks?.v4?.find(n => n.type === 'public')?.ip_address ?? null
}

export function dropletPrivateIp(droplet: Droplet): string | null {
  return droplet.networks?.v4?.find(n => n.type === 'private')?.ip_address ?? null
}

export function dropletIpv6(droplet: Droplet): string | null {
  return droplet.networks?.v6?.[0]?.ip_address ?? null
}

type StatusMeta = {
  label: string
  color: 'success' | 'neutral' | 'warning' | 'error'
  icon: string
  pulse?: boolean
}

/** Single source of truth for how each Droplet status looks. */
export const dropletStatusConfig: Record<DropletStatus, StatusMeta> = {
  active: { label: 'Active', color: 'success', icon: 'i-lucide-circle-check' },
  off: { label: 'Off', color: 'neutral', icon: 'i-lucide-circle-stop' },
  new: { label: 'Provisioning', color: 'warning', icon: 'i-lucide-loader', pulse: true },
  archive: { label: 'Archived', color: 'neutral', icon: 'i-lucide-archive' }
}

export function dropletStatusMeta(status: DropletStatus): StatusMeta {
  return dropletStatusConfig[status] ?? dropletStatusConfig.off
}
