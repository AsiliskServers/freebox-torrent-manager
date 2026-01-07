<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold">Freebox Torrent Manager</h2>
          <UIcon name="i-heroicons-arrow-down-tray" class="w-6 h-6" />
        </div>
      </template>

      <div class="space-y-6">
        <!-- Chargement initial -->
        <div v-if="step === 'checking'">
          <div class="text-center mb-4">
            <UIcon name="i-heroicons-arrow-path" class="w-16 h-16 mx-auto text-gray-400 animate-spin" />
          </div>
          
          <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
            Vérification en cours...
          </p>
        </div>
        
        <!-- Étape 1: Enregistrement -->
        <div v-else-if="step === 'register'">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Cliquez sur le bouton ci-dessous pour enregistrer cette application auprès de votre Freebox.
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Vous devrez ensuite <strong>accepter l'autorisation sur l'écran LCD de votre Freebox</strong>.
          </p>
          
          <UButton 
            block
            @click="registerApp"
            :loading="isLoading"
          >
            Enregistrer l'application
          </UButton>
          
          <UAlert 
            v-if="error" 
            color="red" 
            class="mt-4"
            :title="error"
          />
        </div>

        <!-- Étape 2: Attente de validation -->
        <div v-else-if="step === 'waiting'">
          <div class="text-center mb-4">
            <UIcon name="i-heroicons-clock" class="w-16 h-16 mx-auto text-blue-500 animate-pulse" />
          </div>
          
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
            En attente de validation...
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-500 mb-4 text-center">
            Veuillez accepter l'autorisation sur l'écran LCD de votre Freebox
          </p>
          
          <div class="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            <span>Vérification automatique en cours...</span>
          </div>
        </div>

        <!-- Étape 3: Succès -->
        <div v-else-if="step === 'success'">
          <div class="text-center mb-4">
            <UIcon name="i-heroicons-check-circle" class="w-16 h-16 mx-auto text-green-500" />
          </div>
          
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
            Autorisation accordée ! Connexion en cours...
          </p>
        </div>

        <!-- Étape 4: Connexion automatique -->
        <div v-else-if="step === 'autoLogin'">
          <div class="text-center mb-4">
            <UIcon name="i-heroicons-arrow-path" class="w-16 h-16 mx-auto text-primary animate-spin" />
          </div>
          
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
            Application déjà autorisée
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-500 text-center">
            Connexion automatique en cours...
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const step = ref<'checking' | 'register' | 'waiting' | 'success' | 'autoLogin' | 'login'>('checking');
const trackId = ref<number | null>(null);
const error = ref<string | null>(null);
const isLoading = ref(false);

// Vérifier si on a déjà un token sauvegardé et se connecter automatiquement
onMounted(async () => {
  try {
    // Vérifier d'abord si un token existe côté serveur
    const hasToken = await authStore.checkExistingToken();
    
    // Uniquement si le token existe ET est chargé
    if (hasToken === true && authStore.appToken) {
      // Token valide trouvé, connexion automatique avec délai de 2s
      step.value = 'autoLogin';
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Délai fictif de 2s
      
      try {
        await authStore.login();
        router.push('/');
      } catch (err: any) {
        // En cas d'erreur, afficher l'écran d'enregistrement
        error.value = 'Connexion automatique échouée. Veuillez vous enregistrer.';
        step.value = 'register';
      }
    } else {
      // Aucun token trouvé, afficher directement la page d'enregistrement
      step.value = 'register';
    }
  } catch (err) {
    // En cas d'erreur de vérification, afficher l'écran d'enregistrement
    step.value = 'register';
  }
});

async function registerApp() {
  isLoading.value = true;
  error.value = null;
  
  try {
    trackId.value = await authStore.registerApp();
    step.value = 'waiting';
    
    // Commencer à vérifier le statut
    checkAuthStatus();
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de l\'enregistrement';
  } finally {
    isLoading.value = false;
  }
}

async function checkAuthStatus() {
  if (!trackId.value) return;
  
  const maxAttempts = 60; // 2 minutes (60 * 2s)
  let attempts = 0;
  
  const interval = setInterval(async () => {
    attempts++;
    
    try {
      const status = await authStore.trackAuthorization(trackId.value!);
      
      if (status === 'granted') {
        clearInterval(interval);
        step.value = 'success';
        
        // Attendre un peu puis se connecter
        setTimeout(() => {
          login();
        }, 1500);
      } else if (status === 'denied' || status === 'timeout') {
        clearInterval(interval);
        error.value = 'Autorisation refusée ou expirée';
        step.value = 'register';
      }
    } catch (err) {
      console.error('Erreur lors de la vérification:', err);
    }
    
    if (attempts >= maxAttempts) {
      clearInterval(interval);
      error.value = 'Timeout - Veuillez réessayer';
      step.value = 'register';
    }
  }, 2000); // Vérifier toutes les 2 secondes
}

async function login() {
  isLoading.value = true;
  error.value = null;
  
  try {
    await authStore.login();
    
    // Rediriger vers le dashboard
    router.push('/');
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la connexion';
    step.value = 'register';
  } finally {
    isLoading.value = false;
  }
}
</script>
