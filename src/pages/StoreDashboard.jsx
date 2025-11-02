import React, { useEffect, useState } from 'react'
import { SkeletonDashboard } from '../components/Skeletons'

export default function StoreDashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading for dashboard data; replace with real fetch later
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-6">
        <SkeletonDashboard />
      </main>
    )
  }
  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold">Store Dashboard (demo)</h2>
      <p className="text-gray-600 mt-2">This area will show orders, products and controls for store owners.</p>
    </main>
  )
}
