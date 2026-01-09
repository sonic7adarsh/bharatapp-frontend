import axios from 'axios'
import { API_BASE, TENANT_DOMAIN, DEBUG_API } from './env'
import { toast } from 'react-toastify'

const baseURL = import.meta.env?.DEV ? '' : API_BASE
const instance = axios.create({
  baseURL,
  // Do not set a global Content-Type; set per-request to allow FormData boundaries
  timeout: 10000
})

// Build a copy-pastable curl command that mirrors the outgoing request
function buildCurlFromConfig(cfg) {
  try {
    const method = (cfg?.method || 'GET').toUpperCase()

    // Build full backend URL using API_BASE (dev proxy targets backend)
    const baseTarget = String(API_BASE || '').replace(/\/+$/, '')
    const path = String(cfg?.url || '')
    const fullUrl = baseTarget + (path.startsWith('/') ? path : '/' + path)

    // Append query params, preserving any existing query string on url
    let urlObj
    try { urlObj = new URL(fullUrl) } catch { urlObj = null }
    if (urlObj && cfg?.params && typeof cfg.params === 'object') {
      const entries = Object.entries(cfg.params)
      for (const [k, v] of entries) {
        // Support arrays / multiple values
        if (Array.isArray(v)) {
          for (const vv of v) urlObj.searchParams.append(k, vv)
        } else if (v !== undefined && v !== null) {
          urlObj.searchParams.set(k, String(v))
        }
      }
    }

    // Prepare headers, masking sensitive Authorization token
    const headers = []
    const hdrs = cfg?.headers || {}
    const maskAuth = (val) => {
      if (typeof val !== 'string') return val
      const m = val.match(/^Bearer\s+(.+)$/i)
      if (!m) return val
      const tok = m[1]
      if (tok.length <= 12) return 'Bearer [REDACTED]'
      return `Bearer ${tok.slice(0, 6)}…${tok.slice(-4)}`
    }
    for (const [k, v] of Object.entries(hdrs)) {
      if (v == null) continue
      const vv = k.toLowerCase() === 'authorization' ? maskAuth(v) : v
      headers.push(`-H ${JSON.stringify(`${k}: ${vv}`)}`)
    }

    // Prepare body flags
    const isForm = typeof FormData !== 'undefined' && cfg?.data instanceof FormData
    let bodyPart = ''
    if (cfg?.data != null) {
      if (isForm) {
        // Best-effort representation; binary parts are omitted
        const fields = []
        for (const [k, v] of cfg.data.entries()) {
          const val = typeof v === 'string' ? v : '[binary]'
          fields.push(`--form ${JSON.stringify(`${k}=${val}`)}`)
        }
        bodyPart = fields.join(' ')
      } else if (typeof cfg.data === 'object') {
        bodyPart = `--data-raw ${JSON.stringify(JSON.stringify(cfg.data))}`
      } else {
        bodyPart = `--data-raw ${JSON.stringify(String(cfg.data))}`
      }
    }

    const methodPart = method ? `-X ${method}` : ''
    const urlPart = JSON.stringify(urlObj ? urlObj.toString() : fullUrl)
    const parts = ['curl', methodPart, urlPart, ...headers]
    if (bodyPart) parts.push(bodyPart)
    parts.push('--compressed')
    return parts.filter(Boolean).join(' ')
  } catch {
    return null
  }
}

// attach token if present
instance.interceptors.request.use(cfg => {
  // mark start time for duration tracking
  try { cfg.metadata = { startTime: (typeof performance !== 'undefined' ? performance.now() : Date.now()) } } catch {}

  const token = localStorage.getItem('token')
  // Avoid attaching Authorization ONLY for OTP endpoints (send/verify/resend)
  const url = String(cfg?.url || '')
  const isOtpEndpoint = /^\/?api\/storefront\/auth\/otp\//.test(url)
  if (token && !isOtpEndpoint) cfg.headers['Authorization'] = 'Bearer ' + token
  // Attach tenant domain header for BharatShop storefront APIs
  if (!cfg.headers['X-Tenant-Domain']) {
    cfg.headers['X-Tenant-Domain'] = TENANT_DOMAIN
  }

  // Attach correlation id for tracing
  try {
    const rid = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : ('rid_' + Math.random().toString(16).slice(2) + Date.now())
    if (!cfg.headers['X-Request-Id']) cfg.headers['X-Request-Id'] = rid
    // keep on config for response log correlation
    cfg.metadata = { ...(cfg.metadata || {}), requestId: cfg.headers['X-Request-Id'] }
  } catch {}

  // If sending FormData, let the browser set multipart boundaries
  try {
    const isForm = typeof FormData !== 'undefined' && cfg?.data instanceof FormData
    if (isForm) {
      if (cfg.headers) {
        delete cfg.headers['Content-Type']
      }
    } else {
      // Default to JSON for non-FormData requests if not explicitly set
      if (cfg.headers && !cfg.headers['Content-Type']) {
        cfg.headers['Content-Type'] = 'application/json'
      }
    }
  } catch {}

  // Structured request logging (gated by DEBUG_API)
  if (DEBUG_API) {
    try {
      const method = (cfg?.method || '').toUpperCase()
      const url = (cfg?.baseURL || '') + (cfg?.url || '')
      const hasAuth = !!cfg?.headers?.['Authorization']
      const isForm = typeof FormData !== 'undefined' && cfg?.data instanceof FormData
      const dataPreview = (() => {
        if (!cfg?.data) return undefined
        if (isForm) {
          const o = {}
          for (const [k, v] of cfg.data.entries()) {
            o[k] = typeof v === 'string' ? (v.length > 200 ? v.slice(0, 200) + '…' : v) : '[binary]'
          }
          return { formData: o }
        }
        return cfg.data
      })()
      const curl = buildCurlFromConfig(cfg)
      console.groupCollapsed(`[API] → ${method} ${url}`)
      if (cfg.metadata?.requestId) console.log('reqId:', cfg.metadata.requestId)
      console.log('tenant:', cfg.headers['X-Tenant-Domain'])
      console.log('auth:', hasAuth ? '[attached]' : '[none]')
      if (cfg.params) console.log('params:', cfg.params)
      if (typeof dataPreview !== 'undefined') console.log('data:', dataPreview)
      if (curl) console.log('curl:', curl)
      console.groupEnd()
    } catch {}
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
      try { window.__announce?.(successMessage || 'Action completed successfully', 'polite') } catch {}
    }

    // Structured response logging (gated by DEBUG_API)
    if (DEBUG_API) {
      try {
        const start = response?.config?.metadata?.startTime || Date.now()
        const end = (typeof performance !== 'undefined' ? performance.now() : Date.now())
        const durationMs = Math.max(0, Math.round(end - start))
        const url = (response?.config?.baseURL || '') + (response?.config?.url || '')
        const respRid = response?.headers?.['x-request-id'] || response?.headers?.['X-Request-Id']
        console.groupCollapsed(`[API] ✓ ${method} ${url} [${response.status}] ${durationMs}ms`)
        if (response?.config?.metadata?.requestId || respRid) console.log('reqId:', response?.config?.metadata?.requestId || respRid)
        console.log('data:', response?.data)
        console.groupEnd()
      } catch {}
    }
    return response
  },
  (error) => {
    const status = error?.response?.status
    const method = (error?.config?.method || '').toUpperCase()
    const showError = error?.config?.showErrorToast === true
    const message = error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.'

    // Auto-logout on unauthorized to prevent zombie sessions
    if (status === 401) {
      if (true) {
        try { window.__announce?.('Session expired. Please login again.', 'assertive') } catch {}
        try { window.__logout?.() } catch {}
      }
    }

    // Suppress noisy popups on 5xx or GET calls; only toast when explicitly requested
    if (showError && method !== 'GET' && (typeof status === 'number' ? status < 500 : true)) {
      toast.error(message)
      try { window.__announce?.(message, 'assertive') } catch {}
    } else {
      // Log quietly to console to aid debugging without disrupting UX
      console.warn('[API]', method, error?.config?.url, status || '', message)
    }

    // Structured error logging (gated by DEBUG_API)
    if (DEBUG_API) {
      try {
        const start = error?.config?.metadata?.startTime || Date.now()
        const end = (typeof performance !== 'undefined' ? performance.now() : Date.now())
        const durationMs = Math.max(0, Math.round(end - start))
        const url = (error?.config?.baseURL || '') + (error?.config?.url || '')
        const respRid = error?.response?.headers?.['x-request-id'] || error?.response?.headers?.['X-Request-Id']
        console.groupCollapsed(`[API] ✗ ${method} ${url} [${status || 'ERR'}] ${durationMs}ms`)
        if (error?.config?.metadata?.requestId || respRid) console.log('reqId:', error?.config?.metadata?.requestId || respRid)
        console.log('error message:', message)
        if (error?.response?.data) console.log('error data:', error.response.data)
        console.groupEnd()
      } catch {}
    }
    return Promise.reject(error)
  }
)

export default instance
