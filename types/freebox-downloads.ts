/**
 * Types pour l'API Freebox Download
 * Basés sur la documentation officielle de l'API Freebox
 */

// Statuts possibles d'un téléchargement
export type DownloadStatus = 
  | 'stopped'
  | 'queued'
  | 'starting'
  | 'downloading'
  | 'stopping'
  | 'error'
  | 'done'
  | 'checking'
  | 'repairing'
  | 'extracting'
  | 'seeding'
  | 'retry';

// Types de téléchargement
export type DownloadType = 'bt' | 'nzb' | 'http' | 'ftp';

// Priorités de fichier
export type FilePriority = 'no_dl' | 'low' | 'normal' | 'high';

// Objet Download principal
export interface Download {
  id: number;
  name: string;
  status: DownloadStatus;
  type: DownloadType;
  
  // Informations de taille
  size: number;
  rx_bytes: number;
  tx_bytes: number;
  
  // Progression
  rx_rate: number;
  tx_rate: number;
  rx_pct: number; // Progression en centièmes (10000 = 100%)
  
  // Timing
  eta: number;
  created_ts: number;
  
  // BitTorrent spécifique
  seeders?: number;
  peers?: number;
  
  // Informations additionnelles
  error: string;
  error_details?: string; // Message d'erreur détaillé du log
  queue_pos: number;
  info_hash?: string;
  
  // Statut du téléchargement
  stop_ratio: number;
  archive_password?: string;
}

// Statistiques de téléchargement
export interface DownloadStats {
  nb_tasks: number;
  nb_tasks_stopped: number;
  nb_tasks_checking: number;
  nb_tasks_queued: number;
  nb_tasks_extracting: number;
  nb_tasks_done: number;
  nb_tasks_repairing: number;
  nb_tasks_seeding: number;
  nb_tasks_downloading: number;
  nb_tasks_error: number;
  nb_tasks_stopping: number;
  nb_tasks_active: number;
  rx_rate: number;
  tx_rate: number;
}

// Fichier dans un téléchargement
export interface DownloadFile {
  id: number;
  filepath: string;
  size: number;
  downloaded: number;
  priority: FilePriority;
  status: 'queued' | 'downloading' | 'done';
  error?: string;
}

// Tracker d'un torrent
export interface DownloadTracker {
  announce: string;
  type: 'http' | 'udp';
  tier: number;
  is_enabled: boolean;
  last_result?: string;
  last_result_msg?: string;
  
  // Stats
  scrape_seeders?: number;
  scrape_leechers?: number;
  scrape_downloaded?: number;
}

// Peer d'un torrent
export interface DownloadPeer {
  host: string;
  port: number;
  client: string;
  progress: number;
  
  // Vitesses
  down_rate: number;
  up_rate: number;
  
  // Flags
  is_incoming: boolean;
  is_encrypted: boolean;
  is_seeder: boolean;
}

// Configuration des téléchargements
export interface DownloadConfig {
  // Limites globales
  max_downloading_tasks: number;
  max_uploading_tasks: number;
  download_dir: string;
  
  // Vitesses
  max_rx_rate: number;
  max_tx_rate: number;
  
  // BitTorrent
  bt_max_peers: number;
  bt_stop_ratio: number;
  
  // Options
  use_watch_dir: boolean;
  watch_dir?: string;
}

// Feed RSS pour les torrents
export interface DownloadFeed {
  id: number;
  url: string;
  is_auto_fetch: boolean;
  fetch_interval: number;
  last_fetch: number;
  nb_items: number;
}

// Item d'un feed RSS
export interface DownloadFeedItem {
  id: string;
  title: string;
  url: string;
  link: string;
  pub_date: number;
  size?: number;
  is_downloaded: boolean;
}
