import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { PageFade, PressScale } from '../motion/presets'

export default function Partner() {
  const { isAuthenticated, isSeller, isAdmin } = useAuth()
  const navigate = useNavigate()

  const startOnboarding = () => {
    navigate('/onboard')
  }

  return (
    <PageFade className="max-w-3xl mx-auto my-10 px-4">
      <div className="bg-white rounded-lg shadow p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-2">Partner with CityCart</h1>
        <p className="text-gray-600 mb-6">Grow your business with online orders, bookings, and a dedicated seller dashboard. Join local merchants, restaurants, and hotels on CityCart.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 border rounded-md">
            <h2 className="font-semibold mb-2">Register your store</h2>
            <p className="text-gray-600 mb-4">Create your store profile and start receiving orders and bookings.</p>
            {isAuthenticated ? (
              !(isSeller || isAdmin) ? (
                <PressScale>
                  <button onClick={startOnboarding} className="btn-primary w-full">Register Your Store</button>
                </PressScale>
              ) : (
                <div className="rounded bg-yellow-50 text-yellow-800 p-3 text-sm">
                  You're already a CityCart seller — awesome! 🚀 Keep growing with fresh products, seasonal offers, and quick responses.
                </div>
              )
            ) : (
              <PressScale>
                <Link to="/mobile-login?intent=partner" className="btn-primary w-full inline-block text-center">Register your store</Link>
              </PressScale>
            )}
          </div>

          <div className="p-4 border rounded-md">
            <h2 className="font-semibold mb-2">Already a partner?</h2>
            <p className="text-gray-600 mb-4">Access your dashboard to manage orders, bookings, and products.</p>
            {(isSeller || isAdmin) ? (
              <div className="space-y-2">
                <div className="rounded-md bg-brand-accent/10 border border-brand-accent/20 p-3 mb-2">
                  <div className="font-semibold text-brand-accent">You're live on CityCart! 🚀</div>
                  <div className="text-sm text-gray-700">Pro tip: add clear photos and short titles to boost conversions.</div>
                </div>
                <Link to="/dashboard" className="btn-secondary w-full text-center inline-block">Go to Dashboard</Link>
                <Link to="/products/add" className="btn-secondary w-full text-center inline-block">Add Product</Link>
                <Link to="/rooms/add" className="btn-secondary w-full text-center inline-block">Add Room</Link>
              </div>
            ) : (
              isAuthenticated ? (
                <Link to="/onboard" className="btn-secondary w-full text-center inline-block">Complete Seller Onboarding</Link>
              ) : (
                <Link to="/mobile-login" className="btn-secondary w-full text-center inline-block">Login to access dashboard</Link>
              )
            )}
          </div>
        </div>

        {!isAuthenticated && (
          <p className="mt-6 text-sm text-gray-500">Common login: sign in to continue and become a seller.</p>
        )}
      </div>
    </PageFade>
  )
}