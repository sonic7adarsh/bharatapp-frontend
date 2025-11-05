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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your email"
              required
            />
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
            />
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