import crypto from 'crypto';
import type { FreeboxResponse, ApiVersion } from '~/types/freebox-api';
import type { AppToken, AuthTrackResponse, Session, LoginResponse } from '~/types/freebox-auth';
import { saveToken, loadToken, deleteToken, hasToken } from '../utils/token-storage';

/**
 * Service d'authentification pour l'API Freebox
 * Gère l'enregistrement de l'application et les sessions
 */

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const method = getMethod(event);
  const query = getQuery(event);
  
  const baseUrl = config.public.freeboxApiUrl;
  
  try {
    // GET /api/auth - Récupérer les informations de version de l'API
    if (method === 'GET' && !query.action) {
      const response = await $fetch<ApiVersion>(`${baseUrl}/api_version`);
      return response;
    }
    
    // GET /api/auth?action=check - Vérifier si un token existe déjà
    if (method === 'GET' && query.action === 'check') {
      const tokenExists = await hasToken();
      
      if (tokenExists) {
        const tokenData = await loadToken();
        
        // Vérifier que les données sont valides
        if (tokenData && tokenData.app_token && tokenData.track_id) {
          return {
            success: true,
            has_token: true,
            token_data: tokenData
          };
        }
      }
      
      // Pas de token ou token invalide
      return {
        success: true,
        has_token: false
      };
    }
    
    // POST /api/auth?action=register - Enregistrer l'application
    if (method === 'POST' && query.action === 'register') {
      const apiVersionRes = await $fetch<ApiVersion>(`${baseUrl}/api_version`);
      
      if (!apiVersionRes || !apiVersionRes.api_version) {
        throw new Error('Impossible de récupérer la version de l\'API');
      }
      
      const apiVersion = apiVersionRes.api_version;
      const apiUrl = `${baseUrl}/api/v${apiVersion.split('.')[0]}`;
      
      const appInfo = {
        app_id: config.freeboxAppId,
        app_name: config.freeboxAppName,
        app_version: config.freeboxAppVersion,
        device_name: config.freeboxDeviceName
      };
      
      const response = await $fetch<FreeboxResponse<AppToken>>(
        `${apiUrl}/login/authorize`,
        {
          method: 'POST',
          body: appInfo
        }
      );
      
      // Sauvegarder le token après enregistrement
      if (response.success && response.result) {
        await saveToken(response.result.app_token, response.result.track_id);
      }
      
      return response;
    }
    
    // GET /api/auth?action=track&track_id=X - Suivre le statut d'autorisation
    if (method === 'GET' && query.action === 'track' && query.track_id) {
      const apiVersionRes = await $fetch<ApiVersion>(`${baseUrl}/api_version`);
      
      if (!apiVersionRes || !apiVersionRes.api_version) {
        throw new Error('Impossible de récupérer la version de l\'API');
      }
      
      const apiVersion = apiVersionRes.api_version;
      const apiUrl = `${baseUrl}/api/v${apiVersion.split('.')[0]}`;
      
      const response = await $fetch<FreeboxResponse<AuthTrackResponse>>(
        `${apiUrl}/login/authorize/${query.track_id}`
      );
      
      return response;
    }
    
    // POST /api/auth?action=login - Se connecter avec le token
    if (method === 'POST' && query.action === 'login') {
      const body = await readBody(event);
      const { app_token } = body;
      
      if (!app_token) {
        throw createError({
          statusCode: 400,
          message: 'app_token requis'
        });
      }
      
      const apiVersionRes = await $fetch<ApiVersion>(`${baseUrl}/api_version`);
      
      if (!apiVersionRes || !apiVersionRes.api_version) {
        throw new Error('Impossible de récupérer la version de l\'API');
      }
      
      const apiVersion = apiVersionRes.api_version;
      const apiUrl = `${baseUrl}/api/v${apiVersion.split('.')[0]}`;
      
      // Étape 1: Récupérer le challenge
      const challengeRes = await $fetch<FreeboxResponse<LoginResponse>>(
        `${apiUrl}/login`
      );
      
      if (!challengeRes.success || !challengeRes.result?.challenge) {
        throw new Error('Impossible de récupérer le challenge');
      }
      
      const challenge = challengeRes.result.challenge;
      
      // Étape 2: Calculer le mot de passe
      const password = crypto
        .createHmac('sha1', app_token)
        .update(challenge)
        .digest('hex');
      
      // Étape 3: Ouvrir la session
      const sessionRes = await $fetch<FreeboxResponse<Session>>(
        `${apiUrl}/login/session`,
        {
          method: 'POST',
          body: {
            app_id: config.freeboxAppId,
            password
          }
        }
      );
      
      return sessionRes;
    }
    
    // POST /api/auth?action=logout - Se déconnecter
    if (method === 'POST' && query.action === 'logout') {
      const body = await readBody(event);
      const { session_token } = body;
      
      if (!session_token) {
        throw createError({
          statusCode: 400,
          message: 'session_token requis'
        });
      }
      
      const apiVersionRes = await $fetch<ApiVersion>(`${baseUrl}/api_version`);
      
      if (!apiVersionRes || !apiVersionRes.api_version) {
        throw new Error('Impossible de récupérer la version de l\'API');
      }
      
      const apiVersion = apiVersionRes.api_version;
      const apiUrl = `${baseUrl}/api/v${apiVersion.split('.')[0]}`;
      
      const response = await $fetch<FreeboxResponse>(
        `${apiUrl}/login/logout`,
        {
          method: 'POST',
          headers: {
            'X-Fbx-App-Auth': session_token
          }
        }
      );
      
      // Supprimer le token sauvegardé lors du logout
      await deleteToken();
      
      return response;
    }
    
    throw createError({
      statusCode: 400,
      message: 'Action non reconnue'
    });
    
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erreur lors de la communication avec l\'API Freebox'
    });
  }
});
