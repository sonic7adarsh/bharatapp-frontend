import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import useAuth from '../hooks/useAuth'
import { PageFade, PressScale } from '../motion/presets'
import FormAlert from '../components/FormAlert'

export default function Login() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleChange = (e) => {
    const { id, value } = e.target
    setCredentials(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(true)

    if (!credentials.email || !credentials.password) {
      const msg = 'Please fill in all fields'
      setFormError(msg)
      toast.error(msg)
      return
    }
    
    setFormError('')
    setIsLoading(true)
    
    try {
      const params = new URLSearchParams(location.search)
      const intent = params.get('intent') || ''
      const payload = intent === 'partner' ? { ...credentials, role: 'seller' } : credentials
      const result = await login(payload)
      
      if (result.success) {
        const role = String(result.user?.role || '').toLowerCase()
        const defaultDest = role === 'admin' ? '/admin' : ((role === 'seller' || role === 'vendor') ? '/dashboard' : '/')
        const partnerDest = intent === 'partner' ? (role === 'admin' ? '/admin' : ((role === 'seller' || role === 'vendor') ? '/dashboard' : '/onboard')) : null
        const to = location.state?.from || partnerDest || defaultDest
        navigate(to, { replace: true })
      } else {
        // Error toast is handled globally via axios interceptor
      }
    } catch (error) {
      console.error('Login error:', error)
      // Error toast is handled globally via axios interceptor
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageFade className="max-w-md mx-auto my-12 px-4" aria-labelledby="login-title">
      {/* Global ToastContainer is rendered in main.jsx */}
      <h1 id="login-title" className="text-2xl font-bold text-center mb-6">Login to Your Account</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} aria-describedby="login-help" aria-labelledby="login-title">
          <FormAlert message={formError} />
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={credentials.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your email"
              required
              aria-invalid={!credentials.email && submitted}
              aria-describedby="email-help"
            />
            {!credentials.email && submitted && (
              <p id="email-help" className="text-xs text-red-600 mt-1" aria-live="polite">Email is required.</p>
            )}
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={credentials.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your password"
              required
              aria-invalid={!credentials.password && submitted}
              aria-describedby="password-help"
            />
            {!credentials.password && submitted && (
              <p id="password-help" className="text-xs text-red-600 mt-1" aria-live="polite">Password is required.</p>
            )}
          </div>
          <PressScale className="block">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full btn-primary ${isLoading ? 'disabled:opacity-60' : ''}`}
              aria-busy={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </PressScale>
        </form>
        <div className="mt-6 space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>
          
          <Link
            to="/mobile-login"
            className="w-full flex justify-center items-center py-2 px-4 btn-outline"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Login with Mobile OTP
          </Link>
        </div>
        
        <p className="mt-4 text-center text-gray-600">
          Don't have an account? <Link to="/register" className="link-brand">Register</Link>
        </p>
      </div>
    </PageFade>
  )
}