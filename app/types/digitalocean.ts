/**
 * Hand-written slices of the DigitalOcean API v2 types we actually use.
 * DigitalOcean ships no official TypeScript types, so verify shapes against
 * https://docs.digitalocean.com/reference/api/ before extending these.
 */

/** GET /v2/account */
export interface DoAccount {
  uuid: string
  email: string
  email_verified: boolean
  status: 'active' | 'warning' | 'locked'
  status_message?: string
  droplet_limit: number
  reserved_ip_limit: number
  floating_ip_limit: number
  team?: {
    uuid: string
    name: string
  }
}

/**
 * Standard paginated list envelope. Each list response also carries its collection under
 * the plural resource name, e.g. `interface DropletsResponse extends DoPaginated { droplets: Droplet[] }`.
 */
export interface DoPaginated {
  links: {
    pages?: {
      first?: string
      prev?: string
      next?: string
      last?: string
    }
  }
  meta: {
    total: number
  }
}

/** Async action returned by power/resize/snapshot/etc. operations. */
export interface DoAction {
  id: number
  status: 'in-progress' | 'completed' | 'errored'
  type: string
  started_at: string
  completed_at: string | null
  resource_id: number
  resource_type: string
}
