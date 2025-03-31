# Contributing Guide

## Development Setup
1. Clone the repository
2. Copy `.env.example` to `.env`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

## Architecture
This project uses:
- Triplit for offline-first data storage
- Supabase for authentication
- Angular 19.2 for UI

### Key Concepts
- Local-first: All data is stored locally first
- Sync on demand: Data syncs to cloud when user chooses
- Per-user isolation: Data is completely isolated per user

## Testing
1. Unit tests: `npm run test`
2. E2E tests: `npm run e2e`

## Deployment
1. Set required environment variables
2. Run `npm run build`
3. Deploy `dist/angular/browser`