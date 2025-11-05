export const FREE_DELIVERY_THRESHOLD = 199
export const DELIVERY_FEE_DEFAULT = 29
// Configure serviceable pincodes via env: VITE_SERVICEABLE_PINCODES=110001,110002
export const SERVICEABLE_PINCODES = (import.meta.env?.VITE_SERVICEABLE_PINCODES || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)