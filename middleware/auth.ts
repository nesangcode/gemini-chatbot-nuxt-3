import { abortNavigation } from '#app'

export default defineNuxtRouteMiddleware(async to => {
  const { isAuthenticated, signIn } = useLogtoSession()

  if (!isAuthenticated.value) {
    if (process.client) {
      await signIn(to.fullPath)
      return abortNavigation()
    }

    return signIn(to.fullPath)
  }
})
