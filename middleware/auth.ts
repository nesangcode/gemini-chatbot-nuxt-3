export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useLogto()
  
  // If user is not authenticated, redirect to home page
  if (!isAuthenticated.value) {
    return navigateTo('/')
  }
})