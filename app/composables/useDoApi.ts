import type { DoAccount } from '~/types/digitalocean'
import type {
  Droplet,
  DropletsResponse,
  DropletActionResponse,
  DropletActionsResponse,
  DropletActionBody,
  DropletCreateRequest,
  SizesResponse,
  RegionsResponse,
  ImagesResponse,
  SSHKeysResponse,
  MetricsResponse
} from '~/types/droplet'

/**
 * Typed wrapper around `$doFetch` for the DigitalOcean API.
 * Use these inside Pinia Colada `useQuery` / `useMutation` calls.
 */
export function useDoApi() {
  const { $doFetch } = useNuxtApp()
  const config = useRuntimeConfig()

  return {
    account: {
      get: () => $doFetch<{ account: DoAccount }>('/account'),
      // Validate an arbitrary token (when adding a team), bypassing the active one.
      verify: (token: string) =>
        $fetch<{ account: DoAccount }>('/account', {
          baseURL: config.public.digitalOceanApiBase,
          headers: { Authorization: `Bearer ${token.trim()}` }
        })
    },

    droplets: {
      list: (page = 1, perPage = 200) =>
        $doFetch<DropletsResponse>('/droplets', { query: { page, per_page: perPage } }),
      get: (id: number) =>
        $doFetch<{ droplet: Droplet }>(`/droplets/${id}`),
      create: (body: DropletCreateRequest) =>
        $doFetch<{ droplet: Droplet }>('/droplets', { method: 'POST', body }),
      remove: (id: number) =>
        $doFetch(`/droplets/${id}`, { method: 'DELETE' }),
      action: (id: number, body: DropletActionBody) =>
        $doFetch<DropletActionResponse>(`/droplets/${id}/actions`, { method: 'POST', body }),
      getAction: (id: number, actionId: number) =>
        $doFetch<DropletActionResponse>(`/droplets/${id}/actions/${actionId}`),
      listActions: (id: number, page = 1, perPage = 25) =>
        $doFetch<DropletActionsResponse>(`/droplets/${id}/actions`, { query: { page, per_page: perPage } })
    },

    // Lookups for the create wizard.
    sizes: {
      list: () => $doFetch<SizesResponse>('/sizes', { query: { per_page: 200 } })
    },
    regions: {
      list: () => $doFetch<RegionsResponse>('/regions', { query: { per_page: 200 } })
    },
    images: {
      list: (type: 'distribution' | 'application' = 'distribution') =>
        $doFetch<ImagesResponse>('/images', { query: { type, per_page: 200 } }),
      listSnapshots: () =>
        $doFetch<ImagesResponse>('/images', { query: { private: true, per_page: 200 } })
    },
    sshKeys: {
      list: () => $doFetch<SSHKeysResponse>('/account/keys', { query: { per_page: 200 } })
    },

    monitoring: {
      metric: (metric: string, query: Record<string, string | number>) =>
        $doFetch<MetricsResponse>(`/monitoring/metrics/droplet/${metric}`, { query })
    }
  }
}
