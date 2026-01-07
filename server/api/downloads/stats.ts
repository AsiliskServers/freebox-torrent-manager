import type { FreeboxResponse, ApiVersion } from '~/types/freebox-api';
import type { DownloadStats } from '~/types/freebox-downloads';

/**
 * Endpoint pour récupérer les statistiques des téléchargements
 */

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.freeboxApiUrl;
  const sessionToken = getHeader(event, 'X-Fbx-App-Auth');
  
  if (!sessionToken) {
    throw createError({
      statusCode: 401,
      message: 'Session token requis'
    });
  }
  
  try {
    // Récupérer la version de l'API
    const apiVersionRes = await $fetch<ApiVersion>(`${baseUrl}/api_version`);
    
    if (!apiVersionRes || !apiVersionRes.api_version) {
      throw new Error('Impossible de récupérer la version de l\'API');
    }
    
    const apiVersion = apiVersionRes.api_version;
    const apiUrl = `${baseUrl}/api/v${apiVersion.split('.')[0]}`;
    
    const response = await $fetch<FreeboxResponse<DownloadStats>>(
      `${apiUrl}/downloads/stats`,
      {
        headers: {
          'X-Fbx-App-Auth': sessionToken
        }
      }
    );
    
    return response;
    
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erreur lors de la récupération des statistiques'
    });
  }
});
