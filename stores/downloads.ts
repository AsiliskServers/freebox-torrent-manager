import { defineStore } from 'pinia';
import type { Download, DownloadStats } from '~/types/freebox-downloads';
import type { FreeboxResponse } from '~/types/freebox-api';
import { useAuthStore } from './auth';

/**
 * Store Pinia pour gérer les téléchargements
 */

interface DownloadsState {
  downloads: Download[];
  stats: DownloadStats | null;
  isLoading: boolean;
  error: string | null;
  selectedDownload: Download | null;
  downloadDir: string | null; // Dossier de téléchargement par défaut (base64)
}

export const useDownloadsStore = defineStore('downloads', {
  state: (): DownloadsState => ({
    downloads: [],
    stats: null,
    isLoading: false,
    error: null,
    selectedDownload: null,
    downloadDir: null
  }),
  
  getters: {
    // Téléchargements actifs (sans ceux en partage)
    activeDownloads: (state) => 
      state.downloads.filter(d => 
        ['downloading', 'checking'].includes(d.status)
      ),
    
    // Téléchargements terminés
    completedDownloads: (state) => 
      state.downloads.filter(d => d.status === 'done'),
    
    // Téléchargements en erreur
    errorDownloads: (state) => 
      state.downloads.filter(d => d.status === 'error'),
    
    // Téléchargements en attente
    queuedDownloads: (state) => 
      state.downloads.filter(d => d.status === 'queued'),
    
    // Vitesse totale de téléchargement
    totalDownloadRate: (state) => 
      state.downloads.reduce((sum, d) => sum + d.rx_rate, 0),
    
    // Vitesse totale d'upload
    totalUploadRate: (state) => 
      state.downloads.reduce((sum, d) => sum + d.tx_rate, 0)
  },
  
  actions: {
    /**
     * Récupérer tous les téléchargements
     */
    async fetchDownloads() {
      this.isLoading = true;
      this.error = null;
      
      const authStore = useAuthStore();
      const sessionToken = authStore.getSessionToken();
      
      if (!sessionToken) {
        this.error = 'Non authentifié';
        this.isLoading = false;
        return;
      }
      
      try {
        const response = await $fetch<FreeboxResponse<Download[]>>('/api/downloads', {
          headers: {
            'X-Fbx-App-Auth': sessionToken
          }
        });
        
        if (!response.success || !response.result) {
          throw new Error(response.msg || 'Échec de la récupération des téléchargements');
        }
        
        this.downloads = response.result;
        
        // Enrichir les downloads en erreur avec les détails du log
        const downloadsWithErrors = this.downloads.filter(d => d.error && d.error !== 'none');
        if (downloadsWithErrors.length > 0) {
          // Récupérer les logs en parallèle (sans bloquer)
          Promise.all(
            downloadsWithErrors.map(async (download) => {
              try {
                const logResponse = await $fetch<FreeboxResponse<string>>(
                  `/api/downloads/log?downloadId=${download.id}`,
                  {
                    headers: {
                      'X-Fbx-App-Auth': sessionToken
                    }
                  }
                );
                
                if (logResponse.success && logResponse.result) {
                  // Extraire le message d'erreur du tracker depuis le log
                  const lines = logResponse.result.split('\n');
                  const trackerErrorLine = lines.reverse().find(line => 
                    line.includes('tracker failure reason:') || line.includes('tracker error:')
                  );
                  
                  if (trackerErrorLine) {
                    const match = trackerErrorLine.match(/reason: (.+)$/) || 
                                trackerErrorLine.match(/error: (.+)$/);
                    if (match) {
                      download.error_details = match[1].trim();
                    }
                  }
                }
              } catch (err) {
                // Silencieux - si on ne peut pas récupérer le log, ce n'est pas grave
              }
            })
          );
        }
        
      } catch (error: any) {
        console.error('[DOWNLOADS] Error:', error);
        this.error = error.message || 'Erreur lors de la récupération des téléchargements';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Récupérer les statistiques
     */
    async fetchStats() {
      const authStore = useAuthStore();
      const sessionToken = authStore.getSessionToken();
      
      if (!sessionToken) return;
      
      try {
        console.log('[DOWNLOADS] Fetching stats...');
        const response = await $fetch<FreeboxResponse<DownloadStats>>('/api/downloads/stats', {
          headers: {
            'X-Fbx-App-Auth': sessionToken
          }
        });
        
        if (response.success && response.result) {
          this.stats = response.result;
        }
        
      } catch (error) {
        // Silencieux pour les stats
      }
    },
    
    /**
     * Récupérer la configuration du downloader
     * Permet d'obtenir le dossier de téléchargement par défaut
     */
    async fetchConfig() {
      const authStore = useAuthStore();
      const sessionToken = authStore.getSessionToken();
      
      if (!sessionToken) return;
      
      try {
        const response = await $fetch<FreeboxResponse<any>>('/api/downloads/config', {
          headers: {
            'X-Fbx-App-Auth': sessionToken
          }
        });
        
        if (response.success && response.result && response.result.download_dir) {
          this.downloadDir = response.result.download_dir;
          console.log('[DOWNLOADS] Configuration récupérée - Dossier de base (base64):', this.downloadDir);
          if (this.downloadDir) {
            try {
              const decodedDir = atob(this.downloadDir);
              console.log('[DOWNLOADS] Dossier de base (décodé):', decodedDir);
            } catch (e) {
              console.error('[DOWNLOADS] Erreur décodage base64:', e);
            }
          }
        }
        
      } catch (error) {
        console.error('[DOWNLOADS] Erreur lors de la récupération de la config:', error);
      }
    },
    
    /**
     * Construire le chemin complet de téléchargement
     * Si l'utilisateur fournit un sous-dossier, on le concatène avec le dossier par défaut
     */
    buildDownloadPath(subPath?: string): string | undefined {
      if (!subPath || subPath.trim() === '') {
        return undefined; // Utiliser le dossier par défaut de la Freebox
      }
      
      // Si on n'a pas encore récupéré la config, on ne peut pas construire le chemin
      if (!this.downloadDir) {
        console.warn('[DOWNLOADS] buildDownloadPath: downloadDir non disponible, utilisation du dossier par défaut');
        return undefined;
      }
      
      try {
        // Décoder le dossier par défaut depuis base64
        const baseDir = atob(this.downloadDir);
        
        // Nettoyer le sous-chemin
        let cleanSubPath = subPath.trim();
        
        // Enlever le / de début si présent
        if (cleanSubPath.startsWith('/')) {
          cleanSubPath = cleanSubPath.substring(1);
        }
        
        // Construire le chemin complet
        let fullPath = baseDir;
        if (!fullPath.endsWith('/')) {
          fullPath += '/';
        }
        fullPath += cleanSubPath;
        
        console.log('[DOWNLOADS] Chemin construit:', {
          baseDir,
          subPath: cleanSubPath,
          fullPath
        });
        
        // Encoder en base64 pour l'API Freebox
        return btoa(fullPath);
      } catch (error) {
        console.error('[DOWNLOADS] Erreur lors de la construction du chemin:', error);
        return undefined;
      }
    },
    
    /**
     * Ajouter un téléchargement via URL/magnet
     */
    async addDownload(url: string, downloadDir?: string) {
      this.isLoading = true;
      this.error = null;
      
      const authStore = useAuthStore();
      const sessionToken = authStore.getSessionToken();
      
      if (!sessionToken) {
        this.error = 'Non authentifié';
        this.isLoading = false;
        return;
      }
      
      try {
        // Construire le chemin complet si un sous-dossier est fourni
        const fullPath = this.buildDownloadPath(downloadDir);
        
        const response = await $fetch<FreeboxResponse<Download>>('/api/downloads', {
          method: 'POST',
          headers: {
            'X-Fbx-App-Auth': sessionToken
          },
          body: {
            download_url: url,
            download_dir: fullPath
          }
        });
        
        if (!response.success) {
          const errorMsg = response.msg || 'Échec de l\'ajout du téléchargement';
          this.error = errorMsg;
          throw new Error(errorMsg);
        }
        
        // Rafraîchir la liste
        await this.fetchDownloads();
        
      } catch (error: any) {
        const errorMessage = error.data?.msg || error.message || 'Erreur lors de l\'ajout du téléchargement';
        this.error = errorMessage;
        throw new Error(errorMessage);
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Ajouter plusieurs téléchargements via URL/magnet
     */
    async addDownloadMultiple(urls: string[], downloadDir?: string) {
      this.isLoading = true;
      this.error = null;
      
      const authStore = useAuthStore();
      const sessionToken = authStore.getSessionToken();
      
      if (!sessionToken) {
        this.error = 'Non authentifié';
        this.isLoading = false;
        return;
      }
      
      try {
        // Construire le chemin complet si un sous-dossier est fourni
        const fullPath = this.buildDownloadPath(downloadDir);
        
        // Joindre les URLs avec des retours à la ligne
        const urlList = urls.join('\n');
        
        const response = await $fetch<FreeboxResponse<{ id: number[] }>>('/api/downloads', {
          method: 'POST',
          headers: {
            'X-Fbx-App-Auth': sessionToken
          },
          body: {
            download_url_list: urlList,
            download_dir: fullPath
          }
        });
        
        if (!response.success) {
          throw new Error(response.msg || 'Échec de l\'ajout des téléchargements');
        }
        
        // Rafraîchir la liste
        await this.fetchDownloads();
        
      } catch (error: any) {
        this.error = error.message || 'Erreur lors de l\'ajout des téléchargements';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Ajouter un téléchargement via fichier .torrent
     */
    async addDownloadFile(file: File, downloadDir?: string) {
      this.isLoading = true;
      this.error = null;
      
      const authStore = useAuthStore();
      const sessionToken = authStore.getSessionToken();
      
      if (!sessionToken) {
        this.error = 'Non authentifié';
        this.isLoading = false;
        return;
      }
      
      try {
        console.log('[DOWNLOADS] Uploading file:', file.name, 'Size:', file.size);
        
        // Construire le chemin complet si un sous-dossier est fourni
        const fullPath = this.buildDownloadPath(downloadDir);
        
        // Créer un FormData pour l'upload multipart
        const formData = new FormData();
        formData.append('download_file', file);
        
        if (fullPath) {
          // Le chemin est déjà encodé en base64 par buildDownloadPath
          formData.append('download_dir', fullPath);
        }
        
        const response = await $fetch<FreeboxResponse<Download>>('/api/downloads/upload', {
          method: 'POST',
          headers: {
            'X-Fbx-App-Auth': sessionToken
          },
          body: formData
        });
        
        if (!response.success) {
          throw new Error(response.msg || 'Échec de l\'ajout du téléchargement');
        }
        
        // Rafraîchir la liste
        await this.fetchDownloads();
        
      } catch (error: any) {
        const errorMessage = error.data?.msg || error.message || 'Erreur lors de l\'ajout du téléchargement';
        this.error = errorMessage;
        throw new Error(errorMessage);
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Démarrer un téléchargement
     */
    async startDownload(id: number) {
      return this.updateDownloadStatus(id, 'downloading');
    },
    
    /**
     * Arrêter un téléchargement
     */
    async stopDownload(id: number) {
      return this.updateDownloadStatus(id, 'stopped');
    },
    
    /**
     * Reprendre un téléchargement
     */
    async resumeDownload(id: number) {
      return this.updateDownloadStatus(id, 'downloading');
    },
    
    /**
     * Mettre à jour le statut d'un téléchargement
     */
    async updateDownloadStatus(id: number, status: 'stopped' | 'downloading') {
      const authStore = useAuthStore();
      const sessionToken = authStore.getSessionToken();
      
      if (!sessionToken) {
        this.error = 'Non authentifié';
        return;
      }
      
      try {
        await $fetch(`/api/downloads?id=${id}`, {
          method: 'PUT',
          headers: {
            'X-Fbx-App-Auth': sessionToken
          },
          body: {
            status
          }
        });
        
        // Rafraîchir la liste
        await this.fetchDownloads();
        
      } catch (error: any) {
        this.error = error.message || `Erreur lors du changement de statut`;
        throw error;
      }
    },
    
    /**
     * Supprimer un téléchargement
     */
    async deleteDownload(id: number, eraseFiles: boolean = false) {
      const authStore = useAuthStore();
      const sessionToken = authStore.getSessionToken();
      
      if (!sessionToken) {
        this.error = 'Non authentifié';
        return;
      }
      
      try {
        if (eraseFiles) {
          // Supprimer le téléchargement ET les fichiers
          await $fetch(`/api/downloads/erase?id=${id}`, {
            method: 'DELETE',
            headers: {
              'X-Fbx-App-Auth': sessionToken
            }
          });
        } else {
          // Supprimer uniquement le téléchargement (garder les fichiers)
          await $fetch(`/api/downloads?id=${id}`, {
            method: 'DELETE',
            headers: {
              'X-Fbx-App-Auth': sessionToken
            }
          });
        }
        
        // Retirer de la liste locale
        this.downloads = this.downloads.filter(d => d.id !== id);
        
      } catch (error: any) {
        this.error = error.message || 'Erreur lors de la suppression';
        throw error;
      }
    },
    
    /**
     * Sélectionner un téléchargement
     */
    selectDownload(download: Download | null) {
      this.selectedDownload = download;
    }
  }
});
