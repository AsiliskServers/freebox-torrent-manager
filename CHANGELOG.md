# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-07

### Added
- 🎉 Initial release
- 🔐 Freebox authentication with LCD validation
- 📊 Real-time dashboard with download statistics
- ⬇️ Add torrents via URL, magnet links, or .torrent files
- 🎯 Complete torrent management (start, stop, resume, delete)
- 🔍 Search and filter by status
- 📈 Sort by name, size, ratio, remaining time, or date
- 💾 Auto-login with token persistence
- 🌙 Dark mode support
- 🐳 Docker deployment ready
- 🎨 Modern UI with Nuxt UI and Tailwind CSS
- 🔄 Drag & drop for .torrent files
- 📦 Multiple files/URLs upload support
- 🚀 Built with Nuxt 3, Vue 3, TypeScript

### Features
- Real-time download progress tracking
- Upload/download speed monitoring
- ETA calculation
- Ratio tracking and display
- Smart date formatting
- Manual refresh button
- Delete with/without files option
- Multi-file batch upload
- Responsive design

### Technical
- TypeScript strict mode
- Pinia state management
- Server-side API routes with Nitro
- Freebox OS API v15.0 integration
- Docker multi-stage build
- Docker Compose configuration
- Token persistence between restarts

[1.0.0]: https://github.com/your-username/freebox-torrent-manager/releases/tag/v1.0.0
