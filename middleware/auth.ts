export default defineNuxtRouteMiddleware(to => {
  const { isAuthenticated, signIn } = useLogto()

  if (!isAuthenticated.value) {
    return signIn(to.fullPath)
  }
})
