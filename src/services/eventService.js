import axios from '../lib/axios'

// Simple backend-driven event tracker (backend-only)
// Usage: eventService.track('nav_click', { target: '/rooms/add', context: 'header' })
const eventService = {
  async track(eventName, payload = {}) {
    const body = {
      name: String(eventName || '').trim(),
      payload,
      timestamp: Date.now(),
    }
    if (!body.name) return
    try {
      const res = await axios.post('/api/events', body)
      return res?.data || { ok: true }
    } catch (err) {
      // Backend-only: do not store events locally
      return { ok: false, error: err?.message || 'failed' }
    }
  },
}

export default eventService