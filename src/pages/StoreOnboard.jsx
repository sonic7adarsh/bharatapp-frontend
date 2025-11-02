import React, { useMemo, useState } from 'react'
import storeService from '../services/storeService'
import { Link } from 'react-router-dom'

export default function StoreOnboard() {
  const [form, setForm] = useState({
    name: '',
    category: '',
    area: '',
    city: '',
    address: '',
    phone: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [createdStore, setCreatedStore] = useState(null)
  const categories = useMemo(() => ['Grocery', 'Electronics', 'Fashion', 'Healthcare', 'Bakery', 'Stationery'], [])

  function onChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function isValidPhone(v) {
    const digits = String(v || '').replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 12
  }

  function validate() {
    if (!form.name.trim()) return false
    if (!form.category.trim()) return false
    if (!form.area.trim() && !form.city.trim()) return false
    if (!isValidPhone(form.phone)) return false
    if (!form.address.trim()) return false
    return true
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        area: form.area.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        description: form.description.trim()
      }
      const res = await storeService.createStore(payload)
      const newStore = res?.store || res || null
      setCreatedStore(newStore)
      setForm({ name: '', category: '', area: '', city: '', address: '', phone: '', description: '' })
    } catch (err) {
      // Error toast handled globally via axios interceptor
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold">Onboard your store</h2>
      <p className="text-gray-600 mt-1">Fill your store details to start selling in your city.</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Store name</label>
            <input name="name" value={form.name} onChange={onChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select name="category" value={form.category} onChange={onChange} className="w-full border rounded px-3 py-2" required>
              <option value="">Select category</option>
              {categories.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Area / Locality</label>
            <input name="area" value={form.area} onChange={onChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input name="city" value={form.city} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Contact phone</label>
            <input name="phone" value={form.phone} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="10–12 digits" />
            {!isValidPhone(form.phone) && form.phone && (
              <p className="text-xs text-red-600 mt-1">Please enter a valid phone number</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input name="address" value={form.address} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">About the store</label>
          <textarea name="description" value={form.description} onChange={onChange} className="w-full border rounded px-3 py-2" rows={4} placeholder="Brief description (optional)" />
        </div>

        <div className="flex items-center gap-3">
          <button disabled={loading || !validate()} className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60">{loading ? 'Submitting…' : 'Onboard Store'}</button>
          {createdStore && (
            <Link
              to={`/products/add?storeId=${encodeURIComponent(createdStore.id || '')}`}
              className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
            >Add Your First Product</Link>
          )}
        </div>
      </form>

      {createdStore && (
        <div className="mt-6 rounded border bg-green-50 text-green-700 px-4 py-3">
          Store onboarded successfully. ID: {createdStore.id}. You can now add products.
        </div>
      )}
    </main>
  )
}
