# Offline-First with Supabase and Triplit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A demonstration of offline-first capabilities using Triplit for data sync and Supabase for authentication. This project showcases how to:
- Start working immediately without authentication
- Store data locally first
- Sync to cloud when ready
- Maintain data isolation per user

## Setup

### Prerequisites
- Node.js (latest LTS version)
- Supabase account
- Triplit account

### Environment Variables
1. Create a `.env` file in the root directory
2. Get your Triplit credentials:
   - Go to your Triplit project dashboard
   - Copy your database URL
   - Add them to `.env`:
3. Get your Supabase credentials:  
   - Go to your Supabase project dashboard
   - Copy your project URL and anon key
   - Add them to `.env`:
   ```
   # Triplit CLI Variables
   TRIPLIT_DB_URL=your_triplit_database_url
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   ```

### Supabase Configuration
1. Get your Supabase JWT secret:
   - Go to your Supabase project dashboard
   - Navigate to Project Settings > API
   - Copy the JWT Secret 

2. Configure Triplit:
   - Go to your Triplit project dashboard
   - Navigate to Authentication > JWT Configuration
   - Paste your Supabase JWT secret
   - Set the JWT Issuer to "supabase"

This configuration is required for `loginWithToken()` to work properly when syncing local data to the cloud.

### Development
1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm run dev
```
4. Navigate to `http://localhost:4200`

## Architecture

This demo implements a local-first architecture where:
- Users can start working immediately without an account
- Data is stored locally in IndexedDB
- Users can optionally create an account and sync to cloud
- All data remains private per user

## Built With
- Angular 19.2
- Triplit 1.0.16
- Supabase JS 2.49.4

## Live Demo
Try it out at: https://angular-supabase-triplit.netlify.app/

## Documentation
For more details about the implementation, check out our [technical article](link-to-article).

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)

