/**
 * Gate the app behind a connected DigitalOcean token.
 *
 * This is a client-only SPA, so the middleware always runs in the browser, where the
 * persisted token is available. Unconnected users are sent to /connect; connected users
 * never see /connect.
 */
export default defineNuxtRouteMiddleware((to) => {
  const auth = useDoAuthStore()

  if (!auth.isConnected && to.path !== '/connect') {
    return navigateTo('/connect')
  }

  if (auth.isConnected && to.path === '/connect') {
    return navigateTo('/')
  }
})
