/**
 * Types pour les réponses API Freebox
 */

// Réponse générique de l'API
export interface FreeboxResponse<T = unknown> {
  success: boolean;
  result?: T;
  error_code?: string;
  msg?: string;
  uid?: string;
}

// Informations API
export interface ApiVersion {
  uid: string;
  device_name: string;
  api_version: string;
  api_base_url: string;
  device_type: string;
  api_domain: string;
  https_available: boolean;
  https_port: number;
  box_model: string;
  box_model_name: string;
}

// Codes d'erreur API
export enum FreeboxErrorCode {
  AUTH_REQUIRED = 'auth_required',
  INVALID_TOKEN = 'invalid_token',
  PENDING_TOKEN = 'pending_token',
  INSUFFICIENT_RIGHTS = 'insufficient_rights',
  DENIED_FROM_EXTERNAL_IP = 'denied_from_external_ip',
  INVALID_REQUEST = 'invalid_request',
  RATELIMITED = 'ratelimited',
  NEW_APPS_DENIED = 'new_apps_denied',
  APPS_DENIED = 'apps_denied',
  INTERNAL_ERROR = 'internal_error',
  NOT_FOUND = 'not_found'
}
