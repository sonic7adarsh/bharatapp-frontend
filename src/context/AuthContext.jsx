import React, { createContext, useState, useEffect } from 'react'
import axios from '../lib/axios'
import authService from '../services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize user data from token if available
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        localStorage.setItem('token', token)
        try {
          // Fetch user profile if token exists
          const data = await authService.profile()
          setUser(data)
        } catch (error) {
          console.error('Failed to fetch user profile:', error)
          // If token is invalid, clear it
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            logout()
          }
        }
      } else {
        localStorage.removeItem('token')
        setUser(null)
      }
      setLoading(false)
    }

    initializeAuth()
  }, [token])

  // Expose a global logout hook for non-React callers (e.g., axios interceptors)
  useEffect(() => {
    window.__logout = logout
    return () => { delete window.__logout }
  }, [])

  // Login function that accepts credentials and returns user data
  const login = async (credentials) => {
    try {
      const data = await authService.loginWithEmail(credentials)
      const { token: newToken, user: userData } = data
      setToken(newToken)
      setUser(userData)
      return { success: true, user: userData }
    } catch (error) {
      console.error('Login failed:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please try again.'
      }
    }
  }

  // Login with phone/OTP and update context immediately
  const loginWithPhone = async (payload) => {
    try {
      const data = await authService.loginWithPhone(payload)
      const { token: newToken, user: userData } = data
      setToken(newToken)
      setUser(userData)
      return { success: true, user: userData }
    } catch (error) {
      console.error('Phone login failed:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please try again.'
      }
    }
  }

  // Logout function that clears token and user data
  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
  }

  // Register function for new users
  const register = async (userData) => {
    try {
      const data = await authService.register(userData)
      const { token: newToken, user: newUser } = data
      setToken(newToken)
      setUser(newUser)
      return { success: true, user: newUser }
    } catch (error) {
      console.error('Registration failed:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      }
    }
  }

  // Check if user is authenticated
  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      login, 
      loginWithPhone,
      logout, 
      register, 
      isAuthenticated,
      // role helpers
      role: String(user?.role || '').toLowerCase(),
      isSeller: ['seller','vendor'].includes(String(user?.role || '').toLowerCase()),
      isAdmin: String(user?.role || '').toLowerCase() === 'admin',
      isConsumer: ['customer','consumer'].includes(String(user?.role || '').toLowerCase()),
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}
