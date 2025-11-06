import React from 'react'

export default function FormAlert({ message, type = 'error', ariaLive = 'assertive', role = 'alert', className = '' }) {
  if (!message) return null

  const base = 'mb-4 rounded-md p-3'
  const styles = type === 'success'
    ? 'border border-green-200 bg-green-50 text-green-700'
    : type === 'info'
      ? 'border border-blue-200 bg-blue-50 text-blue-700'
      : 'border border-red-200 bg-red-50 text-red-700'

  return (
    <div role={role} aria-live={ariaLive} className={`${base} ${styles} ${className}`}>
      {message}
    </div>
  )
}