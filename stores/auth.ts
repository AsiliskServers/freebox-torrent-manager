import { defineStore } from 'pinia';
import type { AppToken, Session } from '~/types/freebox-auth';
import type { FreeboxResponse } from '~/types/freebox-api';

/**
 * Store Pinia pour gérer l'authentification
 */

interface AuthState {
  appToken: string | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    appToken: null,
    sessionToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  }),
  
  actions: {
    /**
     * Vérifier si un token existe déjà sur le serveur
     */
    async checkExistingToken() {
      try {
        const response = await $fetch<any>('/api/auth?action=check');
        
        if (response.success && response.has_token && response.token_data) {
          this.appToken = response.token_data.app_token;
          if (process.client) {
            localStorage.setItem('freebox_app_token', response.token_data.app_token);
          }
          return true;
        }
        
        // Pas de token serveur, nettoyer le localStorage
        if (process.client) {
          localStorage.removeItem('freebox_app_token');
          localStorage.removeItem('freebox_session_token');
        }
        this.appToken = null;
        
        return false;
      } catch (error) {
        // En cas d'erreur, nettoyer aussi
        if (process.client) {
          localStorage.removeItem('freebox_app_token');
          localStorage.removeItem('freebox_session_token');
        }
        this.appToken = null;
        return false;
      }
    },
    
    /**
     * Enregistrer l'application auprès de la Freebox
     * L'utilisateur doit valider l'autorisation sur l'écran LCD de la Freebox
     */
    async registerApp() {
      this.isLoading = true;
      this.error = null;
      
      try {
        const response = await $fetch<FreeboxResponse<AppToken>>('/api/auth?action=register', {
          method: 'POST'
        });
        
        if (!response.success || !response.result) {
          throw new Error(response.msg || 'Échec de l\'enregistrement');
        }
        
        // Sauvegarder le app_token immédiatement
        this.appToken = response.result.app_token;
        if (process.client) {
          localStorage.setItem('freebox_app_token', response.result.app_token);
        }
        
        // Retourner le track_id pour suivre l'autorisation
        return response.result.track_id;
        
      } catch (error: any) {
        this.error = error.message || 'Erreur lors de l\'enregistrement';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Suivre le statut d'autorisation de l'application
     */
    async trackAuthorization(trackId: number): Promise<string> {
      try {
        const response = await $fetch<FreeboxResponse<{ status: string }>>(
          `/api/auth?action=track&track_id=${trackId}`
        );
        
        if (!response.success || !response.result) {
          throw new Error(response.msg || 'Échec du suivi');
        }
        
        return response.result.status;
        
      } catch (error: any) {
        this.error = error.message || 'Erreur lors du suivi de l\'autorisation';
        throw error;
      }
    },
    
    /**
     * Se connecter avec le token d'application
     */
    async login(appToken?: string) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const token = appToken || this.appToken;
        
        if (!token) {
          throw new Error('Aucun token d\'application disponible');
        }
        
        const response = await $fetch<FreeboxResponse<Session>>('/api/auth?action=login', {
          method: 'POST',
          body: { app_token: token }
        });
        
        if (!response.success || !response.result) {
          throw new Error(response.msg || 'Échec de la connexion');
        }
        
        // Sauvegarder le token de session
        this.sessionToken = response.result.session_token;
        this.isAuthenticated = true;
        
        // Sauvegarder dans le localStorage
        if (process.client) {
          localStorage.setItem('freebox_session_token', response.result.session_token);
        }
        
        return response.result;
        
      } catch (error: any) {
        this.error = error.message || 'Erreur lors de la connexion';
        this.isAuthenticated = false;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Se déconnecter
     */
    async logout() {
      this.isLoading = true;
      this.error = null;
      
      try {
        if (this.sessionToken) {
          await $fetch('/api/auth?action=logout', {
            method: 'POST',
            body: { session_token: this.sessionToken }
          });
        }
        
        // Nettoyer le state et le localStorage
        this.sessionToken = null;
        this.isAuthenticated = false;
        
        if (process.client) {
          localStorage.removeItem('freebox_session_token');
        }
        
      } catch (error: any) {
        this.error = error.message || 'Erreur lors de la déconnexion';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Restaurer la session depuis le localStorage
     */
    async restoreSession() {
      if (!process.client) return;
      
      const appToken = localStorage.getItem('freebox_app_token');
      const sessionToken = localStorage.getItem('freebox_session_token');
      
      if (appToken) {
        this.appToken = appToken;
      }
      
      if (sessionToken) {
        this.sessionToken = sessionToken;
        this.isAuthenticated = true;
      }
    },
    
    /**
     * Obtenir le token de session pour les requêtes API
     */
    getSessionToken(): string | null {
      return this.sessionToken;
    }
  }
});
