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

export const lookupKeys = {
  sizes: (team: string | null) => ['lookup', team, 'sizes'] as const,
  regions: (team: string | null) => ['lookup', team, 'regions'] as const,
  images: (team: string | null, type: string) => ['lookup', team, 'images', type] as const,
  sshKeys: (team: string | null) => ['lookup', team, 'ssh-keys'] as const
}
