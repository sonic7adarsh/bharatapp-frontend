import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import useAuth from '../hooks/useAuth'
import { PageFade, PressScale } from '../motion/presets'
import FormAlert from '../components/FormAlert'

export default function Register() {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])

  const handleChange = (e) => {
    const { id, value } = e.target
    setUserData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    
    if (!userData.name || !userData.email || !userData.password) {
      const msg = 'Please fill in all fields'
      setFormError(msg)
      toast.error(msg)
      return
    }
    
    if (userData.password.length < 6) {
      const msg = 'Password must be at least 6 characters long'
      setFormError(msg)
      toast.error(msg)
      return
    }
    
    setFormError('')
    setIsLoading(true)
    
    try {
      const params = new URLSearchParams(location.search)
      const intent = params.get('intent') || ''
      const payload = intent === 'partner' ? { ...userData, role: 'seller' } : userData
      const result = await register(payload)
      
      if (result.success) {
        const role = String(result.user?.role || 'customer').toLowerCase()
        const intent = params.get('intent') || ''
        const defaultDest = role === 'admin' ? '/admin' : ((role === 'seller' || role === 'vendor') ? '/dashboard' : '/')
        const dest = intent === 'partner' ? '/onboard' : defaultDest
        navigate(dest, { replace: true })
      } else {
        // Error toast is handled globally via axios interceptor
      }
    } catch (error) {
      console.error('Registration error:', error)
      // Error toast is handled globally via axios interceptor
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageFade className="max-w-md mx-auto my-12 px-4" aria-labelledby="register-title">
      {/* Global ToastContainer is rendered in main.jsx */}
      <h1 id="register-title" className="text-2xl font-bold text-center mb-6">Create an Account</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} aria-describedby="register-help" aria-labelledby="register-title">
          <FormAlert message={formError} />
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              id="name"
              value={userData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="Enter your full name"
              required
              aria-invalid={!userData.name && submitted}
              aria-describedby="name-help"
            />
            {!userData.name && submitted && (
              <p id="name-help" className="text-xs text-red-600 mt-1" aria-live="polite">Name is required.</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={userData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your email"
              required
              aria-invalid={!userData.email && submitted}
              aria-describedby="email-help"
            />
            {!userData.email && submitted && (
              <p id="email-help" className="text-xs text-red-600 mt-1" aria-live="polite">Email is required.</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={userData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Create a password"
              required
              minLength={6}
              aria-invalid={(userData.password.length < 6) && submitted}
              aria-describedby="password-help"
            />
            {(userData.password.length < 6) && submitted && (
              <p id="password-help" className="text-xs text-red-600 mt-1" aria-live="polite">Password must be at least 6 characters.</p>
            )}
          </div>
          {/* No role selector: users register as customers by default. Sellers onboard separately. */}
          <PressScale className="block">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full btn-primary ${isLoading ? 'disabled:opacity-60' : ''}`}
              aria-busy={isLoading}
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </PressScale>
        </form>
        <p className="mt-4 text-center text-gray-600">
          Already have an account? <Link to="/login" className="link-brand">Login</Link>
        </p>
      </div>
    </PageFade>
  )
}