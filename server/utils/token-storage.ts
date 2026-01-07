import { promises as fs } from 'fs';
import { join } from 'path';

// Utiliser un dossier persistant pour Docker
const DATA_DIR = process.env.DATA_DIR || process.cwd();
const TOKEN_FILE = join(DATA_DIR, '.freebox-token.json');

interface TokenData {
  app_token: string;
  track_id: number;
  registered_at: string;
}

/**
 * Sauvegarder le token d'enregistrement
 */
export async function saveToken(app_token: string, track_id: number): Promise<void> {
  const data: TokenData = {
    app_token,
    track_id,
    registered_at: new Date().toISOString()
  };
  
  try {
    await fs.writeFile(TOKEN_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du token:', error);
    throw error;
  }
}

/**
 * Charger le token d'enregistrement sauvegardé
 */
export async function loadToken(): Promise<TokenData | null> {
  try {
    const content = await fs.readFile(TOKEN_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null; // Fichier n'existe pas
    }
    console.error('Erreur lors du chargement du token:', error);
    throw error;
  }
}

/**
 * Supprimer le token sauvegardé
 */
export async function deleteToken(): Promise<void> {
  try {
    await fs.unlink(TOKEN_FILE);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error('Erreur lors de la suppression du token:', error);
      throw error;
    }
  }
}

/**
 * Vérifier si un token existe
 */
export async function hasToken(): Promise<boolean> {
  try {
    await fs.access(TOKEN_FILE);
    return true;
  } catch {
    return false;
  }
}
