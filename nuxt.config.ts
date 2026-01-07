// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-01-01',
  devtools: { enabled: true },
  
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],

  typescript: {
    strict: true,
    typeCheck: true
  },

  runtimeConfig: {
    // Private keys (server-side only)
    freeboxAppId: 'freebox.torrent.manager',
    freeboxAppName: 'Freebox Torrent Manager',
    freeboxAppVersion: '1.0.0',
    freeboxDeviceName: 'Nuxt App',
    
    // Public keys (available on client)
    public: {
      freeboxApiUrl: 'http://mafreebox.freebox.fr'
    }
  },

  nitro: {
    preset: 'node-server',
    experimental: {
      openAPI: true
    }
  },
  
  // Configuration pour écouter sur 0.0.0.0
  devServer: {
    host: '0.0.0.0',
    port: 3000
  }
})
