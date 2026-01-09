export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8081'
export const TENANT_DOMAIN = import.meta.env.VITE_TENANT_DOMAIN || 'bharatshop'
// Enable verbose API request/response logging when set to true
export const DEBUG_API = String(import.meta.env.VITE_DEBUG_API || '').toLowerCase() === 'true'