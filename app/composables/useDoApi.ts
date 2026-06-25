import type { DoAccount } from '~/types/digitalocean'

/**
 * Typed wrapper around `$doFetch` for the DigitalOcean API.
 *
 * Each resource gets a small namespace of typed endpoint functions. New resources
 * (droplets, firewalls, databases, …) follow the same shape. Use these inside Pinia Colada
 * `useQuery` / `useMutation` calls — see references/digitalocean-api.md in the skill.
 */
export function useDoApi() {
  const { $doFetch } = useNuxtApp()

  return {
    account: {
      // GET /v2/account
      get: () => $doFetch<{ account: DoAccount }>('/account')
    }
  }
}
