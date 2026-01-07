<template>
  <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
    <div class="flex items-start justify-between">
      <!-- Info principale -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center space-x-2 mb-2">
          <UBadge :color="getStatusColor(download.status)">
            {{ getStatusLabel(download.status) }}
          </UBadge>
          <UBadge v-if="download.type === 'bt'" color="gray">
            <UIcon name="i-mdi-magnet" class="w-3 h-3" />
          </UBadge>
        </div>
        
        <h3 class="font-medium text-sm truncate mb-1">
          {{ download.name }}
        </h3>
        
        <!-- Barre de progression -->
        <div class="mb-2">
          <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>{{ (download.rx_pct / 100).toFixed(2) }}%</span>
            <span>{{ formatSize(download.rx_bytes) }} / {{ formatSize(download.size) }}</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all"
              :class="getProgressColor(download.status)"
              :style="{ width: `${Math.min(download.rx_pct / 100, 100)}%` }"
            />
          </div>
        </div>
        
        <!-- Infos détaillées -->
        <div class="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
          <div v-if="download.rx_rate > 0" class="flex items-center space-x-1">
            <UIcon name="i-heroicons-arrow-down" class="w-3 h-3 text-green-500" />
            <span>{{ formatSpeed(download.rx_rate) }}</span>
          </div>
          
          <div v-if="download.tx_rate > 0" class="flex items-center space-x-1">
            <UIcon name="i-heroicons-arrow-up" class="w-3 h-3 text-blue-500" />
            <span>{{ formatSpeed(download.tx_rate) }}</span>
          </div>
          
          <div v-if="download.eta > 0" class="flex items-center space-x-1">
            <UIcon name="i-heroicons-clock" class="w-3 h-3" />
            <span>{{ formatETA(download.eta) }}</span>
          </div>
          
          <div v-if="download.seeders !== undefined" class="flex items-center space-x-1">
            <UIcon name="i-heroicons-user-group" class="w-3 h-3" />
            <span>{{ download.seeders }} seeds</span>
          </div>
          
          <div class="flex items-center space-x-1">
            <UIcon name="i-heroicons-calendar" class="w-3 h-3" />
            <span>{{ formatDate(download.created_ts) }}</span>
          </div>
          
          <div v-if="download.type === 'bt' && download.rx_bytes > 0" class="flex items-center space-x-1">
            <UIcon name="i-heroicons-arrow-up-on-square" class="w-3 h-3 text-purple-500" />
            <span>Ratio: {{ (download.tx_bytes / download.rx_bytes).toFixed(2) }}/{{ (download.stop_ratio / 100).toFixed(1) }}</span>
          </div>
        </div>
        
        <!-- Erreur -->
        <div v-if="download.error && download.error !== 'none'" class="mt-2">
          <UAlert 
            color="red" 
            variant="soft" 
            :title="download.error_details || getErrorMessage(download.error)" 
          />
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center space-x-1 ml-4">
        <!-- Play/Pause -->
        <UButton
          v-if="canStart(download.status)"
          icon="i-heroicons-play"
          size="sm"
          color="green"
          variant="ghost"
          @click="$emit('action', 'start', download)"
        />
        
        <UButton
          v-if="canStop(download.status)"
          icon="i-heroicons-pause"
          size="sm"
          color="orange"
          variant="ghost"
          @click="$emit('action', 'stop', download)"
        />
        
        <UButton
          v-if="canResume(download.status)"
          icon="i-heroicons-arrow-path"
          size="sm"
          color="blue"
          variant="ghost"
          @click="$emit('action', 'resume', download)"
        />
        
        <!-- Delete -->
        <UButton
          icon="i-heroicons-trash"
          size="sm"
          color="red"
          variant="ghost"
          @click="$emit('action', 'delete', download)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Download, DownloadStatus } from '~/types/freebox-downloads';

const props = defineProps<{
  download: Download;
}>();

defineEmits<{
  action: [action: string, download: Download];
}>();

type BadgeColor = 'primary' | 'gray' | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo' | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose';

function getStatusColor(status: DownloadStatus): BadgeColor {
  const colors: Record<DownloadStatus, BadgeColor> = {
    downloading: 'blue',
    seeding: 'green',
    done: 'green',
    stopped: 'gray',
    queued: 'yellow',
    error: 'red',
    checking: 'blue',
    starting: 'blue',
    stopping: 'orange',
    repairing: 'orange',
    extracting: 'blue',
    retry: 'yellow'
  };
  return colors[status] || 'gray';
}

function getStatusLabel(status: DownloadStatus): string {
  const labels: Record<DownloadStatus, string> = {
    downloading: 'Téléchargement',
    seeding: 'Partage',
    done: 'Terminé',
    stopped: 'Arrêté',
    queued: 'En attente',
    error: 'Erreur',
    checking: 'Vérification',
    starting: 'Démarrage',
    stopping: 'Arrêt',
    repairing: 'Réparation',
    extracting: 'Extraction',
    retry: 'Nouvelle tentative'
  };
  return labels[status] || status;
}

function getProgressColor(status: DownloadStatus): string {
  if (status === 'error') return 'bg-red-500';
  if (status === 'done') return 'bg-green-500';
  if (status === 'seeding') return 'bg-green-400';
  return 'bg-blue-500';
}

function canStart(status: DownloadStatus): boolean {
  return ['stopped', 'queued', 'error'].includes(status);
}

function canStop(status: DownloadStatus): boolean {
  return ['downloading', 'seeding', 'checking'].includes(status);
}

function canResume(status: DownloadStatus): boolean {
  return status === 'stopped';
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s';
  
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const k = 1024;
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  
  return `${(bytesPerSecond / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

function formatETA(seconds: number): string {
  if (seconds === 0) return '∞';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Aujourd\'hui';
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return `Il y a ${diffDays}j`;
  } else {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

function getErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'none': '',
    'bt_tracker_error': 'Erreur de connexion au tracker',
    'bt_invalid_torrent': 'Fichier torrent invalide',
    'disk_full': 'Disque plein',
    'network_error': 'Erreur réseau',
    'invalid_url': 'URL invalide',
    'timeout': 'Délai d\'attente dépassé',
    'internal_error': 'Erreur interne'
  };
  return errorMessages[errorCode] || errorCode;
}
</script>
