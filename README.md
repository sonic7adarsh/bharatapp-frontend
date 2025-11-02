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
  VITE_API_BASE=http://localhost:8080
  ```
- The frontend expects these REST endpoints:
  - GET /api/stores
  - GET /api/stores/{id}
  - POST /api/stores

## Next steps
- Add auth/login, product CRUD, order flows and a real backend (Spring Boot sample provided by the team).
