<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <UIcon name="i-heroicons-arrow-down-tray" class="w-8 h-8 text-primary" />
            <h1 class="text-2xl font-bold">Freebox Torrent Manager</h1>
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- Stats rapides -->
            <div v-if="stats" class="flex items-center space-x-4 text-sm">
              <div class="flex items-center space-x-1">
                <UIcon name="i-heroicons-arrow-down" class="w-4 h-4 text-green-500" />
                <span>{{ formatSpeed(stats.rx_rate) }}</span>
              </div>
              <div class="flex items-center space-x-1">
                <UIcon name="i-heroicons-arrow-up" class="w-4 h-4 text-blue-500" />
                <span>{{ formatSpeed(stats.tx_rate) }}</span>
              </div>
            </div>
            
            <UButton
              icon="i-heroicons-arrow-right-on-rectangle"
              color="red"
              variant="ghost"
              @click="logout"
            >
              Déconnexion
            </UButton>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-6">
      <!-- Actions Bar -->
      <div class="mb-6 flex items-center justify-between">
        <UTabs v-model="activeTab" :items="tabs" />
        
        <div class="flex items-center space-x-2">
          <div class="relative">
            <UInput
              v-model="searchQuery"
              icon="i-heroicons-magnifying-glass"
              placeholder="Rechercher..."
              class="w-64"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
          
          <UButton
            icon="i-heroicons-arrow-path"
            color="gray"
            variant="outline"
            :loading="isLoading"
            @click="refresh"
          >
            Rafraîchir
          </UButton>
          
          <UButton
            icon="i-heroicons-plus"
            @click="showAddModal = true"
          >
            Ajouter un torrent
          </UButton>
        </div>
      </div>

      <!-- Stats Cards -->
      <div v-if="stats" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p class="text-2xl font-bold">{{ stats.nb_tasks || 0 }}</p>
            </div>
            <UIcon name="i-heroicons-folder" class="w-8 h-8 text-gray-400" />
          </div>
        </UCard>
        
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">En cours</p>
              <p class="text-2xl font-bold">{{ stats.nb_tasks_downloading || 0 }}</p>
            </div>
            <UIcon name="i-heroicons-arrow-down-tray" class="w-8 h-8 text-blue-500" />
          </div>
        </UCard>
        
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">En attente</p>
              <p class="text-2xl font-bold">{{ nbTasksQueued }}</p>
            </div>
            <UIcon name="i-heroicons-clock" class="w-8 h-8 text-orange-500" />
          </div>
        </UCard>
        
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">En partage</p>
              <p class="text-2xl font-bold">{{ stats.nb_tasks_seeding || 0 }}</p>
            </div>
            <UIcon name="i-heroicons-arrow-up-circle" class="w-8 h-8 text-green-500" />
          </div>
        </UCard>
        
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Terminés</p>
              <p class="text-2xl font-bold">{{ stats.nb_tasks_done || 0 }}</p>
            </div>
            <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-green-500" />
          </div>
        </UCard>
        
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Erreurs</p>
              <p class="text-2xl font-bold">{{ stats.nb_tasks_error || 0 }}</p>
            </div>
            <UIcon name="i-heroicons-exclamation-circle" class="w-8 h-8 text-red-500" />
          </div>
        </UCard>
      </div>
      
      <!-- Sort Bar -->
      <div class="mb-4 flex items-center justify-end">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ filteredDownloads.length }} torrent(s)</span>
          <span class="text-gray-300 dark:text-gray-600">|</span>
          <span class="text-sm text-gray-600 dark:text-gray-400">Trier par:</span>
          <USelectMenu
            v-model="sortBy"
            :options="sortOptions"
            value-attribute="value"
            option-attribute="label"
            class="w-56"
          />
          <UButton
            :icon="sortOrder === 'asc' ? 'i-heroicons-arrow-up' : 'i-heroicons-arrow-down'"
            color="gray"
            variant="ghost"
            size="sm"
            @click="toggleSortOrder"
          >
            {{ sortOrder === 'asc' ? 'Croissant' : 'Décroissant' }}
          </UButton>
        </div>
      </div>

      <!-- Downloads List -->
      <UCard>
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin" />
        </div>
        
        <div v-else-if="filteredDownloads.length === 0" class="text-center py-12 text-gray-500">
          Aucun téléchargement
        </div>
        
        <div v-else class="space-y-2">
          <DownloadItem
            v-for="download in filteredDownloads"
            :key="download.id"
            :download="download"
            @action="handleAction"
          />
        </div>
      </UCard>
    </div>

    <!-- Modal Ajouter Torrent -->
    <UModal v-model="showAddModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Ajouter un torrent</h3>
        </template>
        
        <div class="space-y-4">
          <UFormGroup label="URL ou lien magnet (un par ligne)">
            <UTextarea
              v-model="newTorrentUrl"
              placeholder="https://... ou magnet:...&#10;magnet:?xt=urn:btih:...&#10;https://..."
              :rows="4"
            />
            <template #help>
              <span class="text-xs text-gray-500">Collez plusieurs liens séparés par des retours à la ligne</span>
            </template>
          </UFormGroup>
          
          <UFormGroup label="Dossier de destination (optionnel)">
            <UInput
              v-model="newTorrentDir"
              placeholder="Téléchargements"
            />
          </UFormGroup>
          
          <div class="relative">
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">Ou déposez des fichiers .torrent</div>
            <div
              @drop.prevent="handleDrop"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @click="() => fileInput?.click()"
              :class="[
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
              ]"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".torrent"
                multiple
                class="hidden"
                @change="handleFileSelect"
              />
              <UIcon 
                name="i-heroicons-arrow-down-tray" 
                class="w-12 h-12 mx-auto mb-2 text-gray-400" 
              />
              <p v-if="selectedFiles.length === 0" class="text-sm text-gray-600 dark:text-gray-400">
                Glissez des fichiers .torrent ici ou cliquez pour sélectionner
              </p>
              <div v-else class="text-sm font-medium text-primary">
                <p v-for="file in selectedFiles" :key="file.name">{{ file.name }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-between items-center">
            <div v-if="addTorrentError" class="text-sm text-red-500">
              {{ addTorrentError }}
            </div>
            <div v-else></div>
            <div class="flex space-x-2">
              <UButton
                color="gray"
                variant="ghost"
                @click="showAddModal = false"
              >
                Annuler
              </UButton>
              <UButton
                @click="addTorrent"
                :loading="isAdding"
              >
                Ajouter
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal Confirmation Suppression -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <div class="flex items-center space-x-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-orange-500" />
            <h3 class="text-lg font-semibold">Supprimer le téléchargement</h3>
          </div>
        </template>
        
        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Êtes-vous sûr de vouloir supprimer ce téléchargement ?
          </p>
          
          <div v-if="downloadToDelete" class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p class="text-sm font-medium truncate">{{ downloadToDelete.name }}</p>
          </div>
          
          <UAlert 
            color="blue" 
            variant="soft" 
            title="Les fichiers téléchargés seront conservés par défaut"
            description="Vous pouvez choisir de supprimer aussi les fichiers si nécessaire."
          />
        </div>
        
        <template #footer>
          <div class="flex justify-between w-full">
            <UButton
              color="gray"
              variant="ghost"
              @click="showDeleteModal = false"
              :disabled="isDeleting"
            >
              Annuler
            </UButton>
            
            <div class="flex space-x-2">
              <UButton
                color="orange"
                @click="deleteDownloadKeepFiles"
                :loading="isDeleting"
              >
                Supprimer (garder fichiers)
              </UButton>
              
              <UButton
                color="red"
                @click="deleteDownloadWithFiles"
                :loading="isDeleting"
              >
                Supprimer tout
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useDownloadsStore } from '~/stores/downloads';
import type { Download } from '~/types/freebox-downloads';

// Middleware pour protéger la page
definePageMeta({
  middleware: 'auth'
});

const authStore = useAuthStore();
const downloadsStore = useDownloadsStore();
const router = useRouter();

const activeTab = ref(0);
const showAddModal = ref(false);
const showDeleteModal = ref(false);
const downloadToDelete = ref<Download | null>(null);
const newTorrentUrl = ref('');
const newTorrentDir = ref('');
const isAdding = ref(false);
const isDeleting = ref(false);
const isDragging = ref(false);
const selectedFiles = ref<File[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const searchQuery = ref('');
const sortBy = ref('name');
const sortOrder = ref<'asc' | 'desc'>('asc');
const addTorrentError = ref('');

const sortOptions = [
  { label: 'Nom', value: 'name' },
  { label: 'Taille', value: 'size' },
  { label: 'Ratio', value: 'ratio' },
  { label: 'Téléchargement restant', value: 'remaining' },
  { label: 'Date d\'ajout', value: 'date' }
];

const isLoading = computed(() => downloadsStore.isLoading);
const stats = computed(() => downloadsStore.stats);

// Calculer le nombre de torrents en attente (queued + stopped)
const nbTasksQueued = computed(() => {
  return downloadsStore.downloads.filter(d => 
    d.status === 'queued' || d.status === 'stopped'
  ).length;
});

// Obtenir le dossier de téléchargement décodé
const baseDownloadDir = computed(() => {
  if (!downloadsStore.downloadDir) return null;
  try {
    return atob(downloadsStore.downloadDir);
  } catch {
    return null;
  }
});

const tabs = [
  { label: 'Tous', value: 'all' },
  { label: 'En partage', value: 'seeding' },
  { label: 'En cours', value: 'active' },
  { label: 'En attente', value: 'queued' },
  { label: 'Terminés', value: 'completed' },
  { label: 'En erreur', value: 'error' }
];

const filteredDownloads = computed(() => {
  let downloads: Download[] = [];
  
  // Filtrer par catégorie
  switch (activeTab.value) {
    case 1:
      // En partage (seeding)
      downloads = downloadsStore.downloads.filter(d => d.status === 'seeding');
      break;
    case 2:
      // En cours
      downloads = downloadsStore.activeDownloads;
      break;
    case 3:
      // En attente (queued + stopped)
      downloads = downloadsStore.downloads.filter(d => 
        d.status === 'queued' || d.status === 'stopped'
      );
      break;
    case 4:
      // Terminés
      downloads = downloadsStore.completedDownloads;
      break;
    case 5:
      // En erreur
      downloads = downloadsStore.downloads.filter(d => d.status === 'error');
      break;
    default:
      // Tous
      downloads = downloadsStore.downloads;
  }
  
  // Filtrer par recherche
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    downloads = downloads.filter(d => 
      d.name.toLowerCase().includes(query)
    );
  }
  
  // Trier
  downloads.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy.value) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'ratio':
        const ratioA = a.rx_bytes > 0 ? a.tx_bytes / a.rx_bytes : 0;
        const ratioB = b.rx_bytes > 0 ? b.tx_bytes / b.rx_bytes : 0;
        comparison = ratioA - ratioB;
        break;
      case 'remaining':
        const remainingA = a.size - a.rx_bytes;
        const remainingB = b.size - b.rx_bytes;
        comparison = remainingA - remainingB;
        break;
      case 'date':
        comparison = a.created_ts - b.created_ts;
        break;
    }
    
    return sortOrder.value === 'asc' ? comparison : -comparison;
  });
  
  return downloads;
});

// Réinitialiser l'erreur et recharger la config quand on ouvre le modal
watch(showAddModal, async (newValue) => {
  if (newValue) {
    addTorrentError.value = '';
    // Recharger la configuration pour s'assurer d'avoir le dossier à jour
    await downloadsStore.fetchConfig();
  }
});

// Charger les données au montage
onMounted(async () => {
  await refresh();
  
  // Charger la configuration pour obtenir le dossier par défaut
  await downloadsStore.fetchConfig();
  
  // Actualiser les stats (débits) toutes les 2 secondes
  const statsInterval = setInterval(async () => {
    await downloadsStore.fetchStats();
  }, 2000);
  
  // Nettoyer l'interval au démontage
  onUnmounted(() => {
    clearInterval(statsInterval);
  });
});

// Fonction de rafraîchissement manuel
async function refresh() {
  await Promise.all([
    downloadsStore.fetchDownloads(),
    downloadsStore.fetchStats()
  ]);
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
}

async function addTorrent() {
  if (!newTorrentUrl.value.trim() && selectedFiles.value.length === 0) return;
  
  isAdding.value = true;
  addTorrentError.value = ''; // Réinitialiser l'erreur
  
  try {
    if (selectedFiles.value.length > 0) {
      // Upload des fichiers torrent
      for (const file of selectedFiles.value) {
        await downloadsStore.addDownloadFile(
          file,
          newTorrentDir.value || undefined
        );
      }
    } else {
      // URL ou magnet (un ou plusieurs)
      const urls = newTorrentUrl.value
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
      
      if (urls.length === 1) {
        // Une seule URL
        await downloadsStore.addDownload(
          urls[0],
          newTorrentDir.value || undefined
        );
      } else if (urls.length > 1) {
        // Plusieurs URLs
        await downloadsStore.addDownloadMultiple(
          urls,
          newTorrentDir.value || undefined
        );
      }
    }
    
    // Fermer le modal et réinitialiser
    showAddModal.value = false;
    newTorrentUrl.value = '';
    newTorrentDir.value = '';
    selectedFiles.value = [];
    isDragging.value = false;
    addTorrentError.value = '';
  } catch (error: any) {
    console.error('Erreur lors de l\'ajout:', error);
    
    // Afficher le message d'erreur dans le modal
    if (error.message?.includes('exists') || error.message?.includes('déjà')) {
      addTorrentError.value = 'Ce torrent est déjà présent';
    } else {
      addTorrentError.value = error.message || 'Impossible d\'ajouter le téléchargement';
    }
    
    // Afficher aussi un toast
    const toast = useToast();
    toast.add({
      title: 'Erreur',
      description: error.message || 'Impossible d\'ajouter le téléchargement',
      color: 'red',
      timeout: 5000
    });
  } finally {
    isAdding.value = false;
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  
  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) return;
  
  // Filtrer uniquement les fichiers .torrent
  const torrentFiles = Array.from(files).filter(file => file.name.endsWith('.torrent'));
  
  if (torrentFiles.length > 0) {
    selectedFiles.value = torrentFiles;
    // Clear URL si des fichiers sont sélectionnés
    newTorrentUrl.value = '';
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  
  if (!files || files.length === 0) return;
  
  // Filtrer uniquement les fichiers .torrent
  const torrentFiles = Array.from(files).filter(file => file.name.endsWith('.torrent'));
  
  if (torrentFiles.length > 0) {
    selectedFiles.value = torrentFiles;
    // Clear URL si des fichiers sont sélectionnés
    newTorrentUrl.value = '';
  }
}

async function handleAction(action: string, download: Download) {
  if (action === 'delete') {
    // Afficher le modal de confirmation
    downloadToDelete.value = download;
    showDeleteModal.value = true;
    return;
  }
  
  try {
    switch (action) {
      case 'start':
        await downloadsStore.startDownload(download.id);
        break;
      case 'stop':
        await downloadsStore.stopDownload(download.id);
        break;
      case 'resume':
        await downloadsStore.resumeDownload(download.id);
        break;
    }
    
    // Rafraîchir après l'action
    await refresh();
  } catch (error) {
    console.error('Erreur lors de l\'action:', error);
  }
}

async function logout() {
  await authStore.logout();
  router.push('/login');
}

async function deleteDownloadKeepFiles() {
  if (!downloadToDelete.value) return;
  
  isDeleting.value = true;
  try {
    await downloadsStore.deleteDownload(downloadToDelete.value.id, false);
    showDeleteModal.value = false;
    downloadToDelete.value = null;
    await refresh();
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
  } finally {
    isDeleting.value = false;
  }
}

async function deleteDownloadWithFiles() {
  if (!downloadToDelete.value) return;
  
  isDeleting.value = true;
  try {
    await downloadsStore.deleteDownload(downloadToDelete.value.id, true);
    showDeleteModal.value = false;
    downloadToDelete.value = null;
    await refresh();
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
  } finally {
    isDeleting.value = false;
  }
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s';
  
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const k = 1024;
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  
  return `${(bytesPerSecond / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}
</script>
