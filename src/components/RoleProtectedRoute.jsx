import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

/**
 * RoleProtectedRoute enforces authentication and role-based access.
 * Usage: <RoleProtectedRoute roles={["seller"]}><Page/></RoleProtectedRoute>
 */
export default function RoleProtectedRoute({ roles = [], children }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  }

  const role = String(user?.role || '').toLowerCase()
  const allowed = Array.isArray(roles) && roles.length > 0 ? roles.map(r => String(r).toLowerCase()) : []
  const isAllowed = allowed.length === 0 ? true : allowed.includes(role)

  if (!isAllowed) {
    // Redirect authenticated but unauthorized users to home
    return <Navigate to="/" replace />
  }

  return children
}