import React, { useEffect, useMemo, useState } from 'react'
import sellerService from '../services/sellerService'
import productService from '../services/productService'
import authService from '../services/authService'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function StoreOnboard() {
  const { isAuthenticated, isSeller, isAdmin, token, loginWithToken } = useAuth()
  const [form, setForm] = useState({
    name: '',
    category: '',
    type: 'Store',
    area: '',
    city: '',
    address: '',
    phone: '',
    pincode: '',
    description: '',
    gstin: '',
    pan: '',
    fssai: '',
    bankAccount: '',
    ifsc: ''
  })
  const [files, setFiles] = useState({ businessCertificate: null, addressProof: null, licenseFile: null })
  const [lastType, setLastType] = useState('Store')
  const [loading, setLoading] = useState(false)
  const [createdStore, setCreatedStore] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [categories, setCategories] = useState([])
  const [catLoading, setCatLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    setCatLoading(true)
    ;(async () => {
      try {
        const list = await productService.getCategories()
        if (!active) return
        setCategories(Array.isArray(list) ? list : [])
        // Preselect first if none chosen
        if (!form.category && Array.isArray(list) && list.length > 0) {
          setForm((prev) => ({ ...prev, category: String(list[0]) }))
        }
      } catch (e) {
        console.error('Category load error:', e)
      } finally {
        if (active) setCatLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  function onChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  function onFileChange(e) {
    const file = e.target.files?.[0] || null
    setFiles(prev => ({ ...prev, [e.target.name]: file }))
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
    if (!form.pincode.trim() || form.pincode.trim().length < 5) return false
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
        type: form.type,
        area: form.area.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        pincode: form.pincode.trim(),
        description: form.description.trim(),
        gstin: form.gstin.trim() || undefined,
        pan: form.pan.trim() || undefined,
        fssai: form.fssai.trim() || undefined,
        bankAccount: form.bankAccount.trim() || undefined,
        ifsc: form.ifsc.trim() || undefined,
        documents: {
          businessCertificate: files.businessCertificate || undefined,
          addressProof: files.addressProof || undefined,
          licenseFile: files.licenseFile || undefined,
        }
      }
      const res = await sellerService.createStore(payload)
      const newStore = res?.store || res || null
      setCreatedStore(newStore)
      setLastType(form.type || 'Store')
      setForm({ name: '', category: '', type: 'Store', area: '', city: '', address: '', phone: '', pincode: '', description: '', gstin: '', pan: '', fssai: '', bankAccount: '', ifsc: '' })
      setFiles({ businessCertificate: null, addressProof: null, licenseFile: null })
      setSubmitted(false)
      // Refresh profile so role reflects seller on success
      try {
        const latest = await authService.profile()
        loginWithToken({ token, user: latest })
      } catch (e) {
        // Non-blocking: proceed to dashboard; axios interceptor will toast errors
        console.debug('Profile refresh after store onboarding failed:', e)
      }
      // Redirect to dashboard after successful onboarding
      navigate('/dashboard')
    } catch (err) {
      // Error toast handled globally via axios interceptor
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      {(isSeller || isAdmin) && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold">You’re already onboarded 🎉</h2>
          <p className="text-gray-700 mt-2">Awesome! Keep the momentum going — add new products, run seasonal offers, and respond quickly to inquiries.</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link to="/dashboard" className="btn-secondary text-center inline-block">Go to Dashboard</Link>
            <Link to="/products/add" className="btn-secondary text-center inline-block">Add Product</Link>
            <Link to="/rooms/add" className="btn-secondary text-center inline-block">Add Room</Link>
          </div>
        </div>
      )}

      {!isAuthenticated && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold">Register your store</h2>
          <p className="text-gray-600 mt-1">Login to start onboarding your store and begin selling.</p>
          <div className="mt-4">
            <Link to="/mobile-login" className="btn-primary inline-block text-center">Login to register your store</Link>
          </div>
        </div>
      )}

      {isAuthenticated && !(isSeller || isAdmin) && (
        <>
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
              <option value="">{catLoading ? 'Loading categories…' : 'Select category'}</option>
              {categories.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
            {!form.category.trim() && submitted && (
              <p id="category-help" className="text-xs text-red-600 mt-1" aria-live="polite">Please select a category.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="business-type">Business type</label>
            <select
              id="business-type"
              name="type"
              value={form.type}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              aria-describedby="type-help"
            >
              <option value="Store">Store</option>
              <option value="Hotel">Hotel</option>
            </select>
            <p id="type-help" className="text-xs text-gray-500 mt-1">Select Hotel if you plan to add rooms.</p>
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
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="store-pincode">Pincode</label>
            <input
              id="store-pincode"
              name="pincode"
              value={form.pincode}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              required
              aria-invalid={!form.pincode.trim() && submitted}
              aria-describedby="pincode-help"
            />
            {!form.pincode.trim() && submitted && (
              <p id="pincode-help" className="text-xs text-red-600 mt-1" aria-live="polite">Pincode is required.</p>
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
            <>
              <Link
                to={`/products/add?storeId=${encodeURIComponent(createdStore.id || '')}`}
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
              >Add Your First Product</Link>
              {String(lastType).toLowerCase() === 'hotel' && (
                <Link
                  to={`/rooms/add?storeId=${encodeURIComponent(createdStore.id || '')}`}
                  className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
                >Add Room Type</Link>
              )}
            </>
          )}
        </div>
      </form>

      {createdStore && (
        <div className="mt-6 rounded border bg-green-50 text-green-700 px-4 py-3">
          Store onboarded successfully. ID: {createdStore.id}. You can now add products{String(lastType).toLowerCase() === 'hotel' ? ' and rooms' : ''}.
        </div>
      )}
        </>
      )}
    </main>
  )
}
