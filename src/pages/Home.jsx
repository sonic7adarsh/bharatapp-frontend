import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StoreCard from '../components/StoreCard'
import { STORES } from '../data/stores'
import storeService from '../services/storeService'
import locationService from '../services/locationService'

export default function Home() {
  const [stores, setStores] = useState(STORES)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [detectedCity, setDetectedCity] = useState('')
  const [detectingCity, setDetectingCity] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // try fetching from backend; fallback to local sample data
    setLoading(true)
    storeService.getStores().then(res => {
      if (res?.length) setStores(res)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Detect city but do NOT auto-redirect; show CTA instead
  useEffect(() => {
    let active = true
    async function run() {
      try {
        setDetectingCity(true)
        let cached = ''
        try { cached = localStorage.getItem('user_city') || '' } catch {}
        if (cached) {
          if (!active) return
          setDetectedCity(cached)
          return
        }
        const city = await locationService.detectCityViaGeolocation()
        if (!active) return
        if (city) {
          setDetectedCity(city)
          try { localStorage.setItem('user_city', city) } catch {}
        }
      } catch {}
      finally { setDetectingCity(false) }
    }
    run()
    return () => { active = false }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/stores?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div>
      {/* Hero Section - Enhanced Mobile */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-12 md:py-20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white opacity-10 rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-white opacity-5 rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white opacity-10 rounded-full"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
            Discover Your Local
            <span className="block text-yellow-300">City Marketplace</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 md:mb-12 max-w-4xl mx-auto leading-relaxed opacity-90">
            BharatApp connects you with the best local stores and services in your neighborhood. Shop local, support community.
          </p>
          
          {/* Search Bar - Mobile Optimized */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8 md:mb-12">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-0">
              <input
                type="text"
                placeholder="Search stores, products, services..."
                className="flex-grow px-4 py-3 sm:py-4 rounded-lg sm:rounded-l-lg sm:rounded-r-none text-gray-800 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 text-base sm:text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-6 py-3 sm:py-4 rounded-lg sm:rounded-l-none sm:rounded-r-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
              >
                Search
              </button>
            </div>
          </form>
          
          <Link 
            to="/stores" 
            className="inline-block bg-white text-indigo-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Browse Stores
          </Link>
          {detectedCity && (
            <div className="mt-3">
              <Link
                to={`/stores?city=${encodeURIComponent(detectedCity)}`}
                className="inline-block bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-5 py-2 rounded-lg font-medium transition-colors"
              >
                Browse stores in {detectedCity}
              </Link>
            </div>
          )}
          {detectingCity && !detectedCity && (
            <p className="mt-3 text-sm text-white/90">Detecting your city…</p>
          )}
        </div>
      </section>

      {/* Featured Stores Section */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Featured Local Stores</h2>
          <Link to="/stores" className="text-indigo-600 hover:text-indigo-800 font-medium">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.slice(0, 3).map(s => (
              <StoreCard key={s.id} store={s} />
            ))}
          </div>
        )}
      </section>
      
      {/* How It Works Section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">How BharatApp Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl mx-auto mb-4">1</div>
              <h3 className="font-bold text-lg mb-2">Discover</h3>
              <p className="text-gray-600">Find local stores and services in your neighborhood</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl mx-auto mb-4">2</div>
              <h3 className="font-bold text-lg mb-2">Connect</h3>
              <p className="text-gray-600">Interact with store owners and view their products</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl mx-auto mb-4">3</div>
              <h3 className="font-bold text-lg mb-2">Support</h3>
              <p className="text-gray-600">Support local businesses and help your community thrive</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
