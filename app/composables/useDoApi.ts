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
import type {
  DatabasesResponse,
  DatabaseResponse,
  DatabaseCreateRequest,
  DatabaseResizeRequest,
  DatabaseMigrateRequest,
  DatabaseMaintenanceRequest,
  DatabaseUsersResponse,
  DatabaseUserResponse,
  DatabaseCreateUserRequest,
  DatabaseDbsResponse,
  DatabaseDbResponse,
  DatabaseCreateDbRequest,
  DatabaseFirewallResponse,
  DatabaseFirewallUpdateRequest,
  DatabaseCaResponse,
  DatabaseOptionsResponse,
  DatabasePoolsResponse,
  DatabasePoolCreateRequest,
  DatabaseReplicasResponse,
  DatabaseReplicaResponse,
  DatabaseReplicaCreateRequest,
  DatabaseConfigResponse,
  DatabaseConfig,
  DatabaseBackupsResponse,
  DatabaseEventsResponse,
  EvictionPolicyResponse,
  SqlModeResponse,
  DatabaseTopicsResponse,
  DatabaseTopicCreateRequest,
  DatabaseIndexesResponse
} from '~/types/database'

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
    },

    // Managed Databases. Cluster ids are UUID strings; users/dbs are addressed by name.
    databases: {
      list: (page = 1, perPage = 200) =>
        $doFetch<DatabasesResponse>('/databases', { query: { page, per_page: perPage } }),
      get: (id: string) =>
        $doFetch<DatabaseResponse>(`/databases/${id}`),
      create: (body: DatabaseCreateRequest) =>
        $doFetch<DatabaseResponse>('/databases', { method: 'POST', body }),
      remove: (id: string) =>
        $doFetch(`/databases/${id}`, { method: 'DELETE' }),
      resize: (id: string, body: DatabaseResizeRequest) =>
        $doFetch(`/databases/${id}/resize`, { method: 'PUT', body }),
      migrate: (id: string, body: DatabaseMigrateRequest) =>
        $doFetch(`/databases/${id}/migrate`, { method: 'PUT', body }),
      updateMaintenance: (id: string, body: DatabaseMaintenanceRequest) =>
        $doFetch(`/databases/${id}/maintenance`, { method: 'PUT', body }),

      listUsers: (id: string) =>
        $doFetch<DatabaseUsersResponse>(`/databases/${id}/users`),
      createUser: (id: string, body: DatabaseCreateUserRequest) =>
        $doFetch<DatabaseUserResponse>(`/databases/${id}/users`, { method: 'POST', body }),
      removeUser: (id: string, name: string) =>
        $doFetch(`/databases/${id}/users/${encodeURIComponent(name)}`, { method: 'DELETE' }),
      resetUserAuth: (id: string, name: string) =>
        $doFetch<DatabaseUserResponse>(`/databases/${id}/users/${encodeURIComponent(name)}/reset_auth`, { method: 'POST', body: {} }),

      listDbs: (id: string) =>
        $doFetch<DatabaseDbsResponse>(`/databases/${id}/dbs`),
      createDb: (id: string, body: DatabaseCreateDbRequest) =>
        $doFetch<DatabaseDbResponse>(`/databases/${id}/dbs`, { method: 'POST', body }),
      removeDb: (id: string, name: string) =>
        $doFetch(`/databases/${id}/dbs/${encodeURIComponent(name)}`, { method: 'DELETE' }),

      getFirewall: (id: string) =>
        $doFetch<DatabaseFirewallResponse>(`/databases/${id}/firewall`),
      updateFirewall: (id: string, body: DatabaseFirewallUpdateRequest) =>
        $doFetch(`/databases/${id}/firewall`, { method: 'PUT', body }),

      getCa: (id: string) =>
        $doFetch<DatabaseCaResponse>(`/databases/${id}/ca`),
      options: () =>
        $doFetch<DatabaseOptionsResponse>('/databases/options'),

      // Connection pools (PostgreSQL)
      listPools: (id: string) =>
        $doFetch<DatabasePoolsResponse>(`/databases/${id}/pools`),
      createPool: (id: string, body: DatabasePoolCreateRequest) =>
        $doFetch(`/databases/${id}/pools`, { method: 'POST', body }),
      removePool: (id: string, name: string) =>
        $doFetch(`/databases/${id}/pools/${encodeURIComponent(name)}`, { method: 'DELETE' }),

      // Read-only replicas
      listReplicas: (id: string) =>
        $doFetch<DatabaseReplicasResponse>(`/databases/${id}/replicas`),
      createReplica: (id: string, body: DatabaseReplicaCreateRequest) =>
        $doFetch<DatabaseReplicaResponse>(`/databases/${id}/replicas`, { method: 'POST', body }),
      removeReplica: (id: string, name: string) =>
        $doFetch(`/databases/${id}/replicas/${encodeURIComponent(name)}`, { method: 'DELETE' }),
      promoteReplica: (id: string, name: string) =>
        $doFetch(`/databases/${id}/replicas/${encodeURIComponent(name)}/promote`, { method: 'PUT' }),

      // Engine configuration
      getConfig: (id: string) =>
        $doFetch<DatabaseConfigResponse>(`/databases/${id}/config`),
      updateConfig: (id: string, config: DatabaseConfig) =>
        $doFetch(`/databases/${id}/config`, { method: 'PATCH', body: { config } }),

      // Backups + activity log
      listBackups: (id: string) =>
        $doFetch<DatabaseBackupsResponse>(`/databases/${id}/backups`),
      listEvents: (id: string) =>
        $doFetch<DatabaseEventsResponse>(`/databases/${id}/events`),

      // Engine-specific settings
      getEvictionPolicy: (id: string) =>
        $doFetch<EvictionPolicyResponse>(`/databases/${id}/eviction_policy`),
      setEvictionPolicy: (id: string, policy: string) =>
        $doFetch(`/databases/${id}/eviction_policy`, { method: 'PUT', body: { eviction_policy: policy } }),
      getSqlMode: (id: string) =>
        $doFetch<SqlModeResponse>(`/databases/${id}/sql_mode`),
      setSqlMode: (id: string, mode: string) =>
        $doFetch(`/databases/${id}/sql_mode`, { method: 'PUT', body: { sql_mode: mode } }),
      listTopics: (id: string) =>
        $doFetch<DatabaseTopicsResponse>(`/databases/${id}/topics`),
      createTopic: (id: string, body: DatabaseTopicCreateRequest) =>
        $doFetch(`/databases/${id}/topics`, { method: 'POST', body }),
      removeTopic: (id: string, name: string) =>
        $doFetch(`/databases/${id}/topics/${encodeURIComponent(name)}`, { method: 'DELETE' }),
      listIndexes: (id: string) =>
        $doFetch<DatabaseIndexesResponse>(`/databases/${id}/indexes`),
      removeIndex: (id: string, name: string) =>
        $doFetch(`/databases/${id}/indexes/${encodeURIComponent(name)}`, { method: 'DELETE' }),

      // MySQL metrics — the only engine DigitalOcean exposes through the monitoring API.
      mysqlMetric: (metric: string, query: Record<string, string | number>) =>
        $doFetch<MetricsResponse>(`/monitoring/metrics/database/mysql/${metric}`, { query })
    }
  }
}
