import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import authService from '../services/authService'

export default function SellerLogin() {
  const navigate = useNavigate()
  const { loginWithToken } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
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
    if (!form.email.trim()) return 'Email or phone is required'
    if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters'
    return null
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) return setError(err)
    setLoading(true)
    try {
      // If input looks like a phone number, send as phone; otherwise email
      const isPhone = /^\d{10}$/.test(form.email)
      const payload = isPhone ? { phone: form.email, password: form.password } : { email: form.email, password: form.password }
      const { token, user } = await authService.sellerLogin(payload)
      loginWithToken({ token, user })
      navigate('/dashboard')
    } catch (error) {
      setError(error?.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Seller Login</h1>
        <p className="text-sm text-gray-500 mb-6">Access your merchant portal</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email or Phone</label>
            <input name="email" value={form.email} onChange={onChange} className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="you@example.com or 10-digit mobile" />
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
          <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center bg-indigo-600 text-white rounded-lg py-2.5 font-medium hover:bg-indigo-700 disabled:opacity-60">
            {loading && <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            Login
          </button>
          <div className="flex items-center justify-between text-sm">
            <a href="#" className="text-indigo-600">Forgot Password?</a>
            <a href="/mobile-login" className="text-indigo-600">Create account</a>
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