import api from '../lib/axios'

const sellerService = {
  // Stores owned by the seller
  async getSellerStores(params = {}) {
    try {
      // Do not default-filter to open; let caller decide visibility
      const finalParams = { ...params }
      const { data } = await api.get('/api/stores', { params: finalParams })
      // Support both array response and object-wrapped { stores: [] }
      const list = Array.isArray(data) ? data : (Array.isArray(data?.stores) ? data.stores : [])
      return list
    } catch (e) {
      console.error('getSellerStores failed:', e)
      return []
    }
  },
  async getSellerStore(storeId) {
    try {
      const { data } = await api.get(`/api/stores/${storeId}`)
      return data
    } catch (e) {
      console.error('getSellerStore failed:', e)
      return null
    }
  },
  async createStore(payload) {
    let body = payload
    // If documents or files are present, use FormData
    if (payload?.documents || payload?.businessCertificate || payload?.addressProof || payload?.licenseFile) {
      const formData = new FormData()
      const entries = Object.entries(payload || {})
      for (const [k, v] of entries) {
        if (v == null) continue
        if (k === 'documents' && typeof v === 'object') {
          for (const [dk, dv] of Object.entries(v)) {
            if (dv != null) formData.append(`documents.${dk}`, dv)
          }
        } else {
          formData.append(k, v)
        }
      }
      body = formData
    }
    try {
      const { data } = await api.post('/api/stores', body, { showSuccessToast: true, successMessage: 'Store created successfully.' })
      return data
    } catch (e) {
      console.error('createStore failed:', e)
      throw e
    }
  },
  async updateStore(storeId, payload) {
    try {
      const { data } = await api.patch(`/api/stores/${storeId}`, payload, { showSuccessToast: true, successMessage: 'Store updated.' })
      return data
    } catch (e) {
      console.error('updateStore failed:', e)
      throw e
    }
  },

  // Products
  async getStoreProducts(storeId, params = {}) {
    try {
      const { data } = await api.get(`/api/stores/${storeId}/products`, { params })
      return Array.isArray(data) ? data : []
    } catch (e) {
      console.error('getStoreProducts failed:', e)
      return []
    }
  },
  async createProduct(storeId, payload) {
    let body = payload
    if (payload?.imageFile) {
      const formData = new FormData()
      formData.append('name', payload.name)
      formData.append('price', payload.price)
      formData.append('description', payload.description)
      formData.append('category', payload.category)
      // Backend expects field name 'imageFile' for uploads
      formData.append('imageFile', payload.imageFile)
      body = formData
    } else {
      // Exclude imageFile from JSON payload if not uploading
      const { imageFile, ...rest } = payload || {}
      body = rest
    }
    try {
      const { data } = await api.post('/api/products', { ...payload, store: storeId }, { showSuccessToast: true, successMessage: 'Product added successfully.' })
      return data
    } catch (e) {
      console.error('createProduct failed:', e)
      throw e
    }
  },
  async updateProduct(productId, payload) {
    try {
      const { data } = await api.patch(`/api/products/${productId}`, payload, { showSuccessToast: true, successMessage: 'Product updated.' })
      return data
    } catch (e) {
      console.error('updateProduct failed:', e)
      throw e
    }
  },
  async deleteProduct(productId) {
    try {
      const { data } = await api.delete(`/api/products/${productId}`, { showSuccessToast: true, successMessage: 'Product deleted.' })
      return data
    } catch (e) {
      console.error('deleteProduct failed:', e)
      throw e
    }
  },
  async updateInventory(productId, payload) {
    try {
      const { data } = await api.patch(`/api/products/${productId}/inventory`, payload.stock, { showSuccessToast: true, successMessage: 'Inventory updated.' })
      return data
    } catch (e) {
      console.error('updateInventory failed:', e)
      throw e
    }
  },

  // Orders
  async getOrders(params = {}) {
    try {
      const { data } = await api.get('/api/orders/store', { params })
      const list = Array.isArray(data) ? data : Array.isArray(data?.orders) ? data.orders : []
      return list
    } catch (e) {
      console.error('getOrders failed:', e)
      return []
    }
  },
  async getOrder(orderId) {
    try {
      const { data } = await api.get(`/api/orders/${orderId}`)
      return data
    } catch (e) {
      console.error('getOrder failed:', e)
      return null
    }
  },
  async updateOrderStatus(orderId, payload) {
    try {
      const { data } = await api.patch(`/api/orders/${orderId}/status`, { status: payload.status, note: payload.note || '' }, { showSuccessToast: true, successMessage: 'Order status updated.' })
      return data
    } catch (e) {
      console.error('updateOrderStatus failed:', e)
      throw e
    }
  },
  async requestRefund(orderId, payload) {
    try {
      const { data } = await api.post(`/api/orders/${orderId}/refunds`, payload, { showSuccessToast: true, successMessage: 'Refund requested.' })
      return data
    } catch (e) {
      console.error('requestRefund failed:', e)
      throw e
    }
  },

  // Hospitality bookings
  async getBookings(params = {}) {
    try {
      const { data } = await api.get('/api/bookings/store', { params })
      return Array.isArray(data) ? data : []
    } catch (e) {
      console.error('getBookings failed:', e)
      return []
    }
  },
  async getBooking(bookingId) {
    try {
      const { data } = await api.get(`/api/bookings/${bookingId}`)
      return data
    } catch (e) {
      console.error('getBooking failed:', e)
      return null
    }
  },
  async updateBookingStatus(bookingId, payload) {
    try {
      const { data } = await api.patch(`/api/bookings/${bookingId}/status`, payload, { showSuccessToast: true, successMessage: 'Booking status updated.' })
      return data
    } catch (e) {
      console.error('updateBookingStatus failed:', e)
      throw e
    }
  },

  // Payouts & settlement
  async getPayouts() {
    try {
      const { data } = await api.get('/api/payouts/store')
      return Array.isArray(data) ? data : []
    } catch (e) {
      console.error('getPayouts failed:', e)
      return []
    }
  },
  async requestPayout(payload) {
    try {
      const { data } = await axios.post('/api/seller/payouts/request', payload, { showSuccessToast: true, successMessage: 'Payout requested.' })
      return data
    } catch (e) {
      console.error('requestPayout failed:', e)
      throw e
    }
  },
  async getPayoutConfig() {
    try {
      const { data } = await axios.get('/api/seller/payouts/config')
      return data
    } catch (e) {
      console.error('getPayoutConfig failed:', e)
      return { method: 'upi', upiId: '', minThreshold: 0 }
    }
  },
  async updatePayoutConfig(payload) {
    try {
      const { data } = await axios.patch('/api/seller/payouts/config', payload, { showSuccessToast: true, successMessage: 'Payout config updated.' })
      return data
    } catch (e) {
      console.error('updatePayoutConfig failed:', e)
      throw e
    }
  },

  // Analytics
  async getOverviewAnalytics(params = {}) {
    try {
      const { data } = await axios.get('/api/seller/analytics/overview', { params })
      return data || {}
    } catch (e) {
      console.error('getOverviewAnalytics failed:', e)
      return { totals: {}, series: [] }
    }
  },

  // Announcements
  async postAnnouncement(payload) {
    try {
      const { data } = await axios.post('/api/seller/announcements', payload, { showSuccessToast: true })
      return data
    } catch (e) {
      console.error('postAnnouncement failed:', e)
      throw e
    }
  },

  // Bulk product upload (CSV)
  async presignBulkProductCsv({ fileName, contentType = 'text/csv', folder = 'bulk-products' }) {
    try {
      const { data } = await axios.post('/api/seller/products/bulk-upload/presign', { fileName, contentType, folder })
      return data
    } catch (e) {
      console.error('presignBulkProductCsv failed:', e)
      throw e
    }
  },
  async bulkUploadProducts(file, { mode = 'upsert', dryRun = false, defaultCurrency, defaultTaxRate } = {}) {
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('mode', mode)
      form.append('dryRun', String(dryRun))
      if (defaultCurrency) form.append('defaultCurrency', defaultCurrency)
      if (defaultTaxRate != null) form.append('defaultTaxRate', String(defaultTaxRate))
      const { data } = await axios.post('/api/seller/products/bulk-upload', form, { showSuccessToast: true, successMessage: dryRun ? 'Dry run completed.' : 'Bulk upload submitted.' })
      return data
    } catch (e) {
      console.error('bulkUploadProducts failed:', e)
      throw e
    }
  },
  async bulkUploadProductsByKey(key, { mode = 'upsert', dryRun = false, defaultCurrency, defaultTaxRate } = {}) {
    try {
      const body = { key, mode, dryRun }
      if (defaultCurrency) body.defaultCurrency = defaultCurrency
      if (defaultTaxRate != null) body.defaultTaxRate = defaultTaxRate
      const { data } = await axios.post('/api/seller/products/bulk-upload', body, { showSuccessToast: true, successMessage: dryRun ? 'Dry run completed.' : 'Bulk upload submitted.' })
      return data
    } catch (e) {
      console.error('bulkUploadProductsByKey failed:', e)
      throw e
    }
  },
  async getBulkUploadStatus(jobId) {
    try {
      const { data } = await axios.get(`/api/seller/products/bulk-upload/${jobId}`)
      return data
    } catch (e) {
      console.error('getBulkUploadStatus failed:', e)
      throw e
    }
  },
  async getBulkUploadErrors(jobId) {
    try {
      const { data } = await axios.get(`/api/seller/products/bulk-upload/${jobId}/errors`)
      return Array.isArray(data) ? data : []
    } catch (e) {
      console.error('getBulkUploadErrors failed:', e)
      return []
    }
  }
}

export default sellerService