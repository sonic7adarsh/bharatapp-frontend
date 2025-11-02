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
  return useContext(AuthContext)
}
