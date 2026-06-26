/**
 * Pinia Colada query-key factories, scoped by the active team id so switching teams yields
 * fresh data (switching also clears the cache — see useDoAuth). Pass `useDoAuthStore().activeId`.
 */
export const dropletKeys = {
  all: (team: string | null) => ['droplets', team] as const,
  list: (team: string | null) => [...dropletKeys.all(team), 'list'] as const,
  detail: (team: string | null, id: number) => [...dropletKeys.all(team), 'detail', id] as const,
  actions: (team: string | null, id: number) => [...dropletKeys.all(team), 'detail', id, 'actions'] as const,
  metrics: (team: string | null, id: number, metric: string, range: string) =>
    [...dropletKeys.all(team), 'detail', id, 'metrics', metric, range] as const
}

export const accountKeys = {
  detail: (team: string | null) => ['account', team] as const
}

/** Managed Databases — cluster ids are UUID strings. Sub-resources nest under the cluster. */
export const databaseKeys = {
  all: (team: string | null) => ['databases', team] as const,
  list: (team: string | null) => [...databaseKeys.all(team), 'list'] as const,
  detail: (team: string | null, id: string) => [...databaseKeys.all(team), 'detail', id] as const,
  users: (team: string | null, id: string) => [...databaseKeys.all(team), 'detail', id, 'users'] as const,
  dbs: (team: string | null, id: string) => [...databaseKeys.all(team), 'detail', id, 'dbs'] as const,
  firewall: (team: string | null, id: string) => [...databaseKeys.all(team), 'detail', id, 'firewall'] as const,
  ca: (team: string | null, id: string) => [...databaseKeys.all(team), 'detail', id, 'ca'] as const,
  pools: (team: string | null, id: string) => [...databaseKeys.all(team), 'detail', id, 'pools'] as const,
  replicas: (team: string | null, id: string) => [...databaseKeys.all(team), 'detail', id, 'replicas'] as const,
  config: (team: string | null, id: string) => [...databaseKeys.all(team), 'detail', id, 'config'] as const,
  backups: (team: string | null, id: string) => [...databaseKeys.all(team), 'detail', id, 'backups'] as const,
  events: (team: string | null, id: string) => [...databaseKeys.all(team), 'detail', id, 'events'] as const,
  eviction: (team: string | null, id: string) => [...databaseKeys.all(team), 'detail', id, 'eviction'] as const,
  sqlMode: (team: string | null, id: string) => [...databaseKeys.all(team), 'detail', id, 'sql-mode'] as const,
  topics: (team: string | null, id: string) => [...databaseKeys.all(team), 'detail', id, 'topics'] as const,
  indexes: (team: string | null, id: string) => [...databaseKeys.all(team), 'detail', id, 'indexes'] as const,
  metrics: (team: string | null, id: string, metric: string, range: string) =>
    [...databaseKeys.all(team), 'detail', id, 'metrics', metric, range] as const,
  options: (team: string | null) => ['databases', team, 'options'] as const
}

export const lookupKeys = {
  sizes: (team: string | null) => ['lookup', team, 'sizes'] as const,
  regions: (team: string | null) => ['lookup', team, 'regions'] as const,
  images: (team: string | null, type: string) => ['lookup', team, 'images', type] as const,
  sshKeys: (team: string | null) => ['lookup', team, 'ssh-keys'] as const
}
