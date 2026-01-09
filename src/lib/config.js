export const FREE_DELIVERY_THRESHOLD = 199
export const DELIVERY_FEE_DEFAULT = 29
export const SERVICEABLE_PINCODES = (import.meta.env?.VITE_SERVICEABLE_PINCODES || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

// Backend API configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE || 'http://localhost:8081',
  tenant: import.meta.env.VITE_TENANT_DOMAIN || 'bharatshop',
  endpoints: {
    auth: '/api/auth',
    mobileAuth: '/api/mobile-auth',
    zones: '/api/zones',
    stores: '/api/stores',
    products: '/api/products',
    orders: '/api/orders',
    riders: '/api/riders'
  }
}