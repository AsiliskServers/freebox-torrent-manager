export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();
  
  // Si on est sur la page de login, pas besoin de vérifier
  if (to.path === '/login') {
    return;
  }
  
  // Si non authentifié, rediriger vers login
  if (!authStore.isAuthenticated) {
    return navigateTo('/login');
  }
});
