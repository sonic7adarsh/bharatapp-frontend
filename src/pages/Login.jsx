import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import useAuth from '../hooks/useAuth'
import { PageFade, PressScale } from '../motion/presets'

export default function Login() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { id, value } = e.target
    setCredentials(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!credentials.email || !credentials.password) {
      toast.error('Please fill in all fields')
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await login(credentials)
      
      if (result.success) {
        // Redirect to dashboard after successful login
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
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
    <PageFade className="max-w-md mx-auto my-12 px-4">
      {/* Global ToastContainer is rendered in main.jsx */}
      <h1 className="text-2xl font-bold text-center mb-6">Login to Your Account</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
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
            />
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
            />
          </div>
          <PressScale className="block">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full btn-primary ${isLoading ? 'disabled:opacity-60' : ''}`}
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