/**
 * Types pour l'authentification API Freebox
 */

// Token d'application
export interface AppToken {
  app_token: string;
  track_id: number;
}

// Statut de l'autorisation
export type AuthStatus = 'unknown' | 'pending' | 'timeout' | 'granted' | 'denied';

// Résultat de suivi de l'autorisation
export interface AuthTrackResponse {
  status: AuthStatus;
  challenge?: string;
  password_salt?: string;
}

// Informations de session
export interface Session {
  session_token: string;
  challenge: string;
  permissions: {
    settings: boolean;
    contacts: boolean;
    calls: boolean;
    explorer: boolean;
    downloader: boolean;
    parental: boolean;
    pvr: boolean;
    home: boolean;
    vm: boolean;
  };
}

// Réponse de login
export interface LoginResponse {
  logged_in: boolean;
  challenge?: string;
  password_salt?: string;
  password_set?: boolean;
}
