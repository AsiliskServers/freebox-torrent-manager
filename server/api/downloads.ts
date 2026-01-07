import type { FreeboxResponse, ApiVersion } from '~/types/freebox-api';
import type { Download, DownloadStats } from '~/types/freebox-downloads';

/**
 * Service API pour la gestion des téléchargements
 * Endpoints pour lister, créer, modifier et supprimer des torrents
 */

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const method = getMethod(event);
  const query = getQuery(event);
  
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
    
    const headers = {
      'X-Fbx-App-Auth': sessionToken
    };
    
    // GET /api/downloads - Lister tous les téléchargements
    if (method === 'GET' && !query.id) {
      const response = await $fetch<FreeboxResponse<Download[]>>(
        `${apiUrl}/downloads/`,
        { headers }
      );
      return response;
    }
    
    // GET /api/downloads?id=X - Récupérer un téléchargement spécifique
    if (method === 'GET' && query.id) {
      const response = await $fetch<FreeboxResponse<Download>>(
        `${apiUrl}/downloads/${query.id}`,
        { headers }
      );
      return response;
    }
    
    // POST /api/downloads - Ajouter un nouveau téléchargement
    if (method === 'POST') {
      const body = await readBody(event);
      
      // Si c'est un fichier torrent encodé en base64
      if (body.download_file) {
        const requestBody: any = {
          download_file_base64: body.download_file
        };
        
        if (body.download_dir) {
          requestBody.download_dir = body.download_dir;
        }
        
        const response = await $fetch<FreeboxResponse<Download>>(
          `${apiUrl}/downloads/add`,
          {
            method: 'POST',
            headers,
            body: requestBody
          }
        );
        return response;
      }
      
      // Si c'est une URL ou un magnet - utiliser application/x-www-form-urlencoded
      const formData = new URLSearchParams();
      
      if (body.download_url) {
        formData.append('download_url', body.download_url);
      }
      
      if (body.download_url_list) {
        formData.append('download_url_list', body.download_url_list);
      }
      
      if (body.download_dir) {
        formData.append('download_dir', body.download_dir);
      }
      
      if (body.recursive) {
        formData.append('recursive', body.recursive);
      }
      
      if (body.username) {
        formData.append('username', body.username);
      }
      
      if (body.password) {
        formData.append('password', body.password);
      }
      
      if (body.archive_password) {
        formData.append('archive_password', body.archive_password);
      }
      
      if (body.cookies) {
        formData.append('cookies', body.cookies);
      }
      
      if (body.hash) {
        formData.append('hash', body.hash);
      }
      
      const response = await $fetch<FreeboxResponse<Download>>(
        `${apiUrl}/downloads/add`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        }
      );
      
      // Loguer l'erreur si l'ajout échoue
      if (!response.success) {
        console.error('[DOWNLOADS] Échec ajout:', {
          url: body.download_url,
          error: response.error_code,
          message: response.msg
        });
      }
      
      return response;
    }
    
    // PUT /api/downloads?id=X - Modifier un téléchargement
    if (method === 'PUT' && query.id) {
      const body = await readBody(event);
      
      const response = await $fetch<FreeboxResponse<Download>>(
        `${apiUrl}/downloads/${query.id}`,
        {
          method: 'PUT',
          headers,
          body
        }
      );
      return response;
    }
    
    // DELETE /api/downloads?id=X - Supprimer un téléchargement
    if (method === 'DELETE' && query.id) {
      const response = await $fetch<FreeboxResponse>(
        `${apiUrl}/downloads/${query.id}`,
        {
          method: 'DELETE',
          headers
        }
      );
      return response;
    }
    
    throw createError({
      statusCode: 400,
      message: 'Requête invalide'
    });
    
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erreur lors de la communication avec l\'API Freebox'
    });
  }
});
