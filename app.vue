<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

// Restaurer la session au chargement
const authStore = useAuthStore();

onMounted(() => {
  authStore.restoreSession();
});
</script>
