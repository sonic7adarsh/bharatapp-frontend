import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import authService from '../services/authService'

export default function SellerRegister() {
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()
  const USE_MOCK_SELLER_AUTH = (import.meta.env?.VITE_USE_MOCK_SELLER_AUTH ?? 'true') === 'true'
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    businessType: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const setError = (msg) => {
    setToast({ type: 'error', message: msg })
    setTimeout(() => setToast(null), 3000)
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    if (!form.name.trim()) return 'Name is required'
    if (!form.email.trim()) return 'Email is required'
    const emailOk = /[^@\s]+@[^@\s]+\.[^@\s]+/.test(form.email)
    if (!emailOk) return 'Enter a valid email'
    if (!form.phone.trim()) return 'Phone is required'
    const phoneOk = /^\d{10}$/.test(form.phone)
    if (!phoneOk) return 'Enter a valid 10-digit phone number'
    if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters'
    if (!form.businessType.trim()) return 'Business type is required'
    return null
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) return setError(err)
    setLoading(true)
    try {
      const { token, user } = await authService.sellerRegister(form)
      // Update auth context immediately with registration response
      loginWithToken({ token, user })
      // Then refresh profile from backend to ensure role reflects latest server state
      try {
        const latest = await authService.profile()
        loginWithToken({ token, user: latest })
        const role = String(latest?.role || '').toLowerCase()
        if (USE_MOCK_SELLER_AUTH && !['seller','vendor'].includes(role)) {
          try { localStorage.setItem('sellerUpgradeIntent', 'true') } catch {}
          const override = { ...(latest || {}), role: 'seller' }
          loginWithToken({ token, user: override })
        }
      } catch (e) {
        console.debug('Profile refresh after seller registration failed:', e)
      }
      navigate('/onboard')
    } catch (error) {
      setError(error?.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Seller Register</h1>
        <p className="text-sm text-gray-500 mb-6">Create your merchant account</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input name="name" value={form.name} onChange={onChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" value={form.email} onChange={onChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input type="tel" name="phone" value={form.phone} onChange={onChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="10-digit mobile" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1 relative">
              <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={onChange} className="w-full border rounded-lg px-3 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••" />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute inset-y-0 right-2 px-2 text-sm text-indigo-600">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Business Type</label>
            <select name="businessType" value={form.businessType} onChange={onChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select type</option>
              <option value="restaurant">Restaurant</option>
              <option value="grocery">Grocery</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="hotel">Hotel</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center bg-indigo-600 text-white rounded-lg py-2.5 font-medium hover:bg-indigo-700 disabled:opacity-60">
            {loading && <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            Create Account
          </button>
          <div className="text-sm text-gray-500 text-center">
            Already have an account? <a href="/mobile-login" className="text-indigo-600 font-medium">Login</a>
          </div>
        </form>
      </div>

      {toast?.type === 'error' && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow">
          {toast.message}
        </div>
      )}
    </div>
  )
}