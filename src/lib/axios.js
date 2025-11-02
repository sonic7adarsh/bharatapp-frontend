import axios from 'axios'
import { API_BASE, TENANT_DOMAIN } from './env'
import { toast } from 'react-toastify'

const baseURL = import.meta.env?.DEV ? '' : API_BASE
const instance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
})

// attach token if present
instance.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers['Authorization'] = 'Bearer ' + token
  // Attach tenant domain header for BharatShop storefront APIs
  if (!cfg.headers['X-Tenant-Domain']) {
    cfg.headers['X-Tenant-Domain'] = TENANT_DOMAIN
  }
  return cfg
})

// global success/error notifications
instance.interceptors.response.use(
  (response) => {
    const method = (response?.config?.method || '').toUpperCase()
    const showSuccess = response?.config?.showSuccessToast
    const successMessage = response?.config?.successMessage
    if (showSuccess && method && method !== 'GET') {
      toast.success(successMessage || 'Action completed successfully')
    }
    return response
  },
  (error) => {
    const status = error?.response?.status
    const method = (error?.config?.method || '').toUpperCase()
    const showError = error?.config?.showErrorToast === true
    const message = error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.'

    // Suppress noisy popups on 5xx or GET calls; only toast when explicitly requested
    if (showError && method !== 'GET' && (typeof status === 'number' ? status < 500 : true)) {
      toast.error(message)
    } else {
      // Log quietly to console to aid debugging without disrupting UX
      console.warn('[API]', method, error?.config?.url, status || '', message)
    }
    return Promise.reject(error)
  }
)

export default instance
