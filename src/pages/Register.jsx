import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import useAuth from '../hooks/useAuth'
import { PageFade, PressScale } from '../motion/presets'

export default function Register() {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { id, value } = e.target
    setUserData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!userData.name || !userData.email || !userData.password) {
      toast.error('Please fill in all fields')
      return
    }
    
    if (userData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await register(userData)
      
      if (result.success) {
        // Redirect to dashboard after successful registration
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
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
    <PageFade className="max-w-md mx-auto my-12 px-4">
      {/* Global ToastContainer is rendered in main.jsx */}
      <h1 className="text-2xl font-bold text-center mb-6">Create an Account</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              id="name"
              value={userData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={userData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={userData.password}
                onChange={handleChange}
                className="w-full px-4 pr-12 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Create a password"
                required
                minLength={6}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M2.1 12.53A11.93 11.93 0 0112 6c4.7 0 8.74 2.73 10.9 6.53a1 1 0 010 .94 12 12 0 01-4.07 4.3l1.42 1.42a1 1 0 11-1.41 1.41L3.51 4.93a1 1 0 011.41-1.41l2.3 2.3A12.4 12.4 0 012 12.53zm8.32-5.31l6.56 6.56A8.02 8.02 0 0020 12c-1.93-3.32-5.46-5.5-8-5.5-.55 0-1.1.08-1.58.22zM12 8a4 4 0 014 4c0 .67-.17 1.3-.46 1.84l-5.38-5.38A4 4 0 0112 8zm0 8a4 4 0 01-4-4c0-.39.06-.76.17-1.11l5.94 5.94A3.98 3.98 0 0112 16z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-2.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <PressScale className="block">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full btn-primary ${isLoading ? 'disabled:opacity-60' : ''}`}
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