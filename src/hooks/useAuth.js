import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

/**
 * Custom hook to access authentication context
 * @returns {Object} Authentication methods and state
 * - token: JWT token
 * - user: Current user data
 * - login: Function to log in user
 * - logout: Function to log out user
 * - register: Function to register new user
 * - isAuthenticated: Boolean indicating if user is authenticated
 * - loading: Boolean indicating if auth state is loading
 */
export default function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    // Safe fallback to avoid destructuring errors when provider isn't mounted yet
    return {
      token: null,
      user: null,
      login: async () => ({ success: false, error: 'Auth not initialized' }),
      loginWithPhone: async () => ({ success: false, error: 'Auth not initialized' }),
      loginWithToken: () => ({ success: false, error: 'Auth not initialized' }),
      logout: () => {},
      register: async () => ({ success: false, error: 'Auth not initialized' }),
      isAuthenticated: false,
      role: '',
      isSeller: false,
      isAdmin: false,
      isConsumer: false,
      loading: false,
    }
  }
  return ctx
}
