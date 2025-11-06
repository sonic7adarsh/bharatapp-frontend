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
  const [submitted, setSubmitted] = useState(false)
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
    setSubmitted(true)
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
      setSubmitted(false)
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

      <form onSubmit={onSubmit} className="mt-4 space-y-4" aria-describedby="onboard-help">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="store-name">Store name</label>
            <input
              id="store-name"
              name="name"
              value={form.name}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              required
              aria-invalid={!form.name.trim() && submitted}
              aria-describedby="name-help"
            />
            {!form.name.trim() && submitted && (
              <p id="name-help" className="text-xs text-red-600 mt-1" aria-live="polite">Store name is required.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="store-category">Category</label>
            <select
              id="store-category"
              name="category"
              value={form.category}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              required
              aria-invalid={!form.category.trim() && submitted}
              aria-describedby="category-help"
            >
              <option value="">Select category</option>
              {categories.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
            {!form.category.trim() && submitted && (
              <p id="category-help" className="text-xs text-red-600 mt-1" aria-live="polite">Please select a category.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div role="group" aria-describedby="location-help">
            <label className="block text-sm font-medium mb-1" htmlFor="store-area">Area / Locality</label>
            <input
              id="store-area"
              name="area"
              value={form.area}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              aria-invalid={(!form.area.trim() && !form.city.trim()) && submitted}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="store-city">City</label>
            <input
              id="store-city"
              name="city"
              value={form.city}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              aria-invalid={(!form.area.trim() && !form.city.trim()) && submitted}
            />
          </div>
        </div>
        {(!form.area.trim() && !form.city.trim()) && submitted && (
          <p id="location-help" className="text-xs text-red-600 mt-1" aria-live="polite">Provide either area/locality or city.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="store-phone">Contact phone</label>
            <input
              id="store-phone"
              name="phone"
              value={form.phone}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              placeholder="10–12 digits"
              aria-invalid={!isValidPhone(form.phone) && submitted}
              aria-describedby="phone-help"
            />
            <p id="phone-help" className="text-xs text-gray-500 mt-1">Numbers only, 10–12 digits.</p>
            {(!isValidPhone(form.phone) && (submitted || form.phone)) && (
              <p className="text-xs text-red-600 mt-1" aria-live="polite">Please enter a valid phone number.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="store-address">Address</label>
            <input
              id="store-address"
              name="address"
              value={form.address}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              required
              aria-invalid={!form.address.trim() && submitted}
              aria-describedby="address-help"
            />
            {!form.address.trim() && submitted && (
              <p id="address-help" className="text-xs text-red-600 mt-1" aria-live="polite">Address is required.</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="store-description">About the store</label>
          <textarea
            id="store-description"
            name="description"
            value={form.description}
            onChange={onChange}
            className="w-full border rounded px-3 py-2"
            rows={4}
            placeholder="Brief description (optional)"
            aria-describedby="description-help"
          />
          <p id="description-help" className="text-xs text-gray-500 mt-1">Optional: a short summary to help customers.</p>
        </div>

        <div className="flex items-center gap-3">
          <button disabled={loading || !validate()} className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60" aria-busy={loading}>{loading ? 'Submitting…' : 'Onboard Store'}</button>
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
