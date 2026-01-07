import type { FreeboxResponse, ApiVersion } from '~/types/freebox-api';

/**
 * Supprimer un téléchargement ET les fichiers associés
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);
  
  const baseUrl = config.public.freeboxApiUrl;
  const sessionToken = getHeader(event, 'X-Fbx-App-Auth');
  
  if (!sessionToken) {
    throw createError({
      statusCode: 401,
      message: 'Session token requis'
    });
  }
  
  if (!query.id) {
    throw createError({
      statusCode: 400,
      message: 'ID du téléchargement requis'
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
    
    const headers = {
      'X-Fbx-App-Auth': sessionToken
    };
    
    // DELETE /api/v8/downloads/{id}/erase
    const response = await $fetch<FreeboxResponse>(
      `${apiUrl}/downloads/${query.id}/erase`,
      {
        method: 'DELETE',
        headers
      }
    );
    
    return response;
    
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erreur lors de la suppression du téléchargement'
    });
  }
});
