# BharatApp — Frontend Starter (React + Vite + Tailwind)

## Quick start

1. Install Node.js (LTS) from https://nodejs.org/ if you don't have it.
2. Open this folder in VS Code.
3. Run the setup script (PowerShell) or manually:
   ```bash
   npm install
   npm run dev
   ```
4. Open http://localhost:5173

## Notes
- The app ships with an in-memory sample dataset in `src/data/stores.js`.
- To connect to your Spring Boot backend, create a `.env.local` file with:
  ```
 VITE_API_BASE=http://localhost:8081
  ```
- The frontend expects these REST endpoints:
  - GET /api/stores
  - GET /api/stores/{id}
  - POST /api/stores

## Deploy to Netlify (Free)

1. Push this project to a GitHub repository.
2. In Netlify, click “Add new site” → “Import from Git”. Select your repo.
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables (optional, for real backend):
     - `VITE_API_BASE` → your API base URL (e.g. `https://api.yourdomain.com`)
     - `VITE_TENANT_DOMAIN` → storefront tenant id/domain (e.g. `demo-store`)
4. Deploy. The included `netlify.toml` sets SPA redirects (`/*` → `/index.html`) so routes work on refresh.

## Next steps
- Add auth/login, product CRUD, order flows and a real backend (Spring Boot sample provided by the team).
