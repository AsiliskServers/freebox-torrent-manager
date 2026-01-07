import type { FreeboxResponse, ApiVersion } from '~/types/freebox-api';
import type { Download } from '~/types/freebox-downloads';

/**
 * Upload d'un fichier torrent/nzb
 * Gère l'upload multipart/form-data requis par l'API Freebox
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
    
    // Lire le FormData de la requête
    const formData = await readFormData(event);
    
    // L'API Freebox attend directement le FormData
    const response = await $fetch<FreeboxResponse<Download>>(
      `${apiUrl}/downloads/add`,
      {
        method: 'POST',
        headers: {
          'X-Fbx-App-Auth': sessionToken
        },
        body: formData
      }
    );
    
    return response;
    
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.data?.msg || error.message || 'Erreur lors de l\'upload du fichier',
      data: error.data
    });
  }
});
