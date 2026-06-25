/**
 * Pinia Colada query-key factories.
 *
 * Keeping keys here (rather than inline) ensures reads and the mutations that invalidate
 * them stay in sync. Resource factories (droplets, firewalls, …) will live here too.
 */
export const accountKeys = {
  root: ['account'] as const
}
