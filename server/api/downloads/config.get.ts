import type { FreeboxResponse, ApiVersion } from '~/types/freebox-api';

/**
 * Récupérer la configuration du downloader Freebox
 * Permet d'obtenir le dossier de téléchargement par défaut
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
    
    // Récupérer la configuration du downloader
    const response = await $fetch<FreeboxResponse<any>>(
      `${apiUrl}/downloads/config/`,
      {
        method: 'GET',
        headers: {
          'X-Fbx-App-Auth': sessionToken
        }
      }
    );
    
    return response;
    
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.data?.msg || error.message || 'Erreur lors de la récupération de la configuration',
      data: error.data
    });
  }
});
