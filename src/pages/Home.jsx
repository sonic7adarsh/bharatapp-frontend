import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StoreCard from '../components/StoreCard'
import { STORES } from '../data/stores'
import storeService from '../services/storeService'
import locationService from '../services/locationService'
import { PageFade, PressScale } from '../motion/presets'
import useAuth from '../hooks/useAuth'

export default function Home() {
  const [stores, setStores] = useState(STORES)
  const [nonHospStores, setNonHospStores] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [detectedCity, setDetectedCity] = useState('')
  const [detectingCity, setDetectingCity] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, isSeller, isAdmin } = useAuth()

  useEffect(() => {
    // try fetching from backend; fallback to local sample data
    const controller = new AbortController()
    setLoading(true)
    storeService.getStores(undefined, { signal: controller.signal })
      .then(res => { if (res?.length) setStores(res) })
      .catch(err => { if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return })
      .finally(() => setLoading(false))
    return () => { controller.abort() }
  }, [])

  // Exclude hospitality from Home featured list
  useEffect(() => {
    const isHospitalityCat = (c = '') => {
      const x = String(c).toLowerCase()
      return x.includes('hotel') || x.includes('hospitality') || x.includes('hospital')
    }
    const filtered = (Array.isArray(stores) ? stores : []).filter(s => !isHospitalityCat(s.category || s.type))
    setNonHospStores(filtered)
  }, [stores])

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
    <PageFade>
      {/* Hero Section - Vibrant multi-hue */}
      <section className="bg-gradient-to-br from-fuchsia-600 via-pink-600 to-orange-500 text-white py-12 md:py-20 relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.6),transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
            Discover trusted local stores
            <span className="block text-orange-200 font-semibold">Shop nearby. Support your community.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed text-pink-100">
            BharatApp connects you to neighborhood shops and services. Explore stores by city, category, and rating.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8 md:mb-10">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-0">
              <label htmlFor="home-search" className="sr-only">Search stores, products, services</label>
              <input
                id="home-search"
                type="text"
                placeholder="Search stores, products, services..."
                aria-label="Search"
                className="flex-grow px-4 py-3 sm:py-4 rounded-lg sm:rounded-l-lg sm:rounded-r-none text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-0 text-base sm:text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="bg-white text-fuchsia-700 hover:bg-fuchsia-50 px-6 py-3 sm:py-4 rounded-lg sm:rounded-l-none sm:rounded-r-lg font-semibold transition-colors shadow-sm"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/stores"
              className="inline-flex items-center gap-2 bg-white text-fuchsia-700 hover:bg-fuchsia-50 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Stores
            </Link>
            {detectedCity && (
              <Link
                to={`/stores?city=${encodeURIComponent(detectedCity)}`}
                className="inline-flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-900 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {`Browse ${detectedCity}`}
              </Link>
            )}
          </div>
          {detectingCity && !detectedCity && (
            <p className="mt-3 text-sm text-white/90">Detecting your city…</p>
          )}

          {/* Trust badges / stats */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-6 text-orange-100">
            <div className="rounded-lg bg-white/15 backdrop-blur px-4 py-3">
              <p className="text-2xl font-bold">50+ </p>
              <p className="text-sm">Curated local stores</p>
            </div>
            <div className="rounded-lg bg-white/15 backdrop-blur px-4 py-3">
              <p className="text-2xl font-bold">10+ </p>
              <p className="text-sm">Cities covered</p>
            </div>
            <div className="rounded-lg bg-white/15 backdrop-blur px-4 py-3 hidden sm:block">
              <p className="text-2xl font-bold">4.8★ </p>
              <p className="text-sm">Avg. store rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section (moved to top) */}
      <section className="bg-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-6">Top Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              'Groceries', 'Pharmacy', 'Electronics', 'Fashion', 'Home & Kitchen', 'Services'
            ].map(cat => (
              <div
                key={cat}
                tabIndex={0}
                aria-label={`Browse ${cat}`}
                className="text-center border rounded-lg px-3 py-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
              >
                <span className="text-sm font-medium text-gray-700">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stores Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold">Featured Local Stores</h2>
           <Link to="/stores" className="link-brand font-medium">
             View All →
           </Link>
         </div>
         <p className="text-gray-600 mb-8">Handpicked shops in your city.</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nonHospStores.slice(0, 6).map(s => (
              <StoreCard key={s.id} store={s} />
            ))}
          </div>
        )}
      </section>

      

      {/* How It Works Section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">How BharatApp Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-brand-accent/10 w-12 h-12 rounded-full flex items-center justify-center text-brand-accent font-bold text-xl mx-auto mb-4">1</div>
              <h3 className="font-bold text-lg mb-2">Discover</h3>
              <p className="text-gray-600">Find local stores and services in your neighborhood</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-brand-accent/10 w-12 h-12 rounded-full flex items-center justify-center text-brand-accent font-bold text-xl mx-auto mb-4">2</div>
              <h3 className="font-bold text-lg mb-2">Connect</h3>
              <p className="text-gray-600">Interact with store owners and view their products</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-brand-accent/10 w-12 h-12 rounded-full flex items-center justify-center text-brand-accent font-bold text-xl mx-auto mb-4">3</div>
              <h3 className="font-bold text-lg mb-2">Support</h3>
              <p className="text-gray-600">Support local businesses and help your community thrive</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              {(isSeller || isAdmin) ? (
                <h3 className="text-xl md:text-2xl font-bold">You're live on BharatApp! 🚀</h3>
              ) : (
                <>
                  <h3 className="text-xl md:text-2xl font-bold">Own a local store?</h3>
                  <p className="mt-1 opacity-90">Join BharatApp and reach nearby customers with ease.</p>
                </>
              )}
            </div>
            {(isSeller || isAdmin) ? (
              <div className="flex flex-wrap gap-3 items-center">
                <Link to="/dashboard" className="inline-flex items-center justify-center px-4 py-2 bg-white text-fuchsia-700 rounded-lg hover:bg-fuchsia-50 font-medium">Go to Dashboard</Link>
                <Link to="/products/add" className="inline-flex items-center justify-center px-4 py-2 bg-white text-fuchsia-700 rounded-lg hover:bg-fuchsia-50 font-medium">Add Product</Link>
                <Link to="/rooms/add" className="inline-flex items-center justify-center px-4 py-2 bg-white text-fuchsia-700 rounded-lg hover:bg-fuchsia-50 font-medium">Add Room</Link>
              </div>
            ) : (
              <PressScale className="inline-block">
                <Link to={isAuthenticated ? "/onboard" : "/mobile-login?intent=partner"} className="inline-flex items-center justify-center px-5 py-3 bg-white text-fuchsia-700 rounded-lg hover:bg-fuchsia-50 font-medium">
                  {isAuthenticated ? 'Register Your Store' : 'Login to register your store'}
                </Link>
              </PressScale>
            )}
          </div>
        </div>
      </section>
    </PageFade>
  )
}
