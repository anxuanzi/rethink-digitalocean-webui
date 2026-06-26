import type { DoPaginated } from '~/types/digitalocean'

/**
 * DigitalOcean Droplet domain types — hand-written from the official `godo` structs.
 * Verify against https://docs.digitalocean.com/reference/api/ when extending.
 */

export type DropletStatus = 'new' | 'active' | 'off' | 'archive'

export interface DropletNetworkV4 {
  ip_address: string
  netmask: string
  gateway: string
  type: 'public' | 'private'
}

export interface DropletNetworkV6 {
  ip_address: string
  netmask: number
  gateway: string
  type: 'public'
}

export interface DropletNetworks {
  v4: DropletNetworkV4[]
  v6: DropletNetworkV6[]
}

export interface DropletRegion {
  slug: string
  name: string
  available?: boolean
  features?: string[]
  sizes?: string[]
}

export interface DropletSize {
  slug: string
  memory: number // MB
  vcpus: number
  disk: number // GB
  transfer: number // TB
  price_monthly: number
  price_hourly: number
  regions: string[]
  available: boolean
  description?: string
}

export interface DropletImage {
  id: number
  name: string
  distribution: string
  slug: string | null
  public: boolean
  type: string // 'snapshot' | 'backup' | 'distribution' | 'application' | 'custom'
  min_disk_size?: number
  size_gigabytes?: number
  created_at?: string
  regions?: string[]
  status?: string
}

export interface DropletKernel {
  id: number
  name: string
  version: string
}

export interface Droplet {
  id: number
  name: string
  memory: number // MB
  vcpus: number
  disk: number // GB
  locked: boolean
  status: DropletStatus
  created_at: string
  features: string[]
  backup_ids: number[]
  snapshot_ids: number[]
  volume_ids: string[]
  image: DropletImage
  size: DropletSize
  size_slug: string
  networks: DropletNetworks
  region: DropletRegion
  tags: string[]
  vpc_uuid?: string
  kernel?: DropletKernel | null
  next_backup_window?: { start: string, end: string } | null
}

export interface DropletsResponse extends DoPaginated {
  droplets: Droplet[]
}

export interface DropletAction {
  id: number
  status: 'in-progress' | 'completed' | 'errored'
  type: string
  started_at: string
  completed_at: string | null
  resource_id: number
  resource_type: string
  region_slug?: string
}

export interface DropletActionResponse {
  action: DropletAction
}

export interface DropletActionsResponse extends DoPaginated {
  actions: DropletAction[]
}

/** Action `type` strings accepted by POST /v2/droplets/{id}/actions. */
export type DropletActionType
  = | 'power_on'
    | 'power_off'
    | 'power_cycle'
    | 'shutdown'
    | 'reboot'
    | 'enable_backups'
    | 'disable_backups'
    | 'snapshot'
    | 'resize'
    | 'rebuild'
    | 'rename'
    | 'enable_ipv6'
    | 'enable_private_networking'
    | 'password_reset'
    | 'restore'
    | 'change_kernel'

export interface DropletActionBody {
  type: DropletActionType
  [param: string]: unknown
}

// --- Supporting resources (used by the create wizard) ---

export interface SSHKey {
  id: number
  fingerprint: string
  public_key: string
  name: string
}
export interface SSHKeysResponse extends DoPaginated { ssh_keys: SSHKey[] }
export interface SizesResponse extends DoPaginated { sizes: DropletSize[] }
export interface RegionsResponse extends DoPaginated { regions: DropletRegion[] }
export interface ImagesResponse extends DoPaginated { images: DropletImage[] }

export interface DropletCreateRequest {
  name: string
  region: string
  size: string
  image: string | number
  ssh_keys?: (number | string)[]
  backups?: boolean
  ipv6?: boolean
  monitoring?: boolean
  tags?: string[]
  user_data?: string
  vpc_uuid?: string
}

// --- Monitoring metrics (Prometheus matrix format) ---

export interface MetricSeries {
  metric: Record<string, string>
  values: [number, string][]
}
export interface MetricsResponse {
  status: string
  data: {
    resultType: string
    result: MetricSeries[]
  }
}
