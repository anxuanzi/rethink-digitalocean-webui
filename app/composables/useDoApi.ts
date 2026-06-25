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
  const config = useRuntimeConfig()

  return {
    account: {
      // GET /v2/account — uses the active token via $doFetch.
      get: () => $doFetch<{ account: DoAccount }>('/account'),

      /**
       * Validate an arbitrary token (the one being added), bypassing $doFetch's active token.
       * Returns the account so we can capture the team + email. Throws (FetchError) if invalid.
       */
      verify: (token: string) =>
        $fetch<{ account: DoAccount }>('/account', {
          baseURL: config.public.digitalOceanApiBase,
          headers: { Authorization: `Bearer ${token.trim()}` }
        })
    }
  }
}
