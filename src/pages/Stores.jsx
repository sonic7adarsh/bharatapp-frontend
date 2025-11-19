import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SkeletonStoreCard } from '../components/Skeletons'
import storeService from '../services/storeService'
import locationService from '../services/locationService'
import { PageFade, HoverLiftCard, PressScale, DrawerRight } from '../motion/presets'
import { useAnnouncer } from '../context/AnnouncerContext'
import useAuth from '../hooks/useAuth'

export default function Stores() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [city, setCity] = useState('')
  const [detectingCity, setDetectingCity] = useState(false)
  const [coords, setCoords] = useState(null)
  const [detectingCoords, setDetectingCoords] = useState(false)
  const [sortBy, setSortBy] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const location = useLocation()
  const { announce } = useAnnouncer()
  const { isAuthenticated, isSeller, isAdmin } = useAuth()

  const categories = useMemo(() => (
    ['All', 'Grocery', 'Electronics', 'Fashion', 'Healthcare']
  ), [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setLoading(true)
    const handler = setTimeout(async () => {
      try {
        const params = {}
        if (search.trim()) params.search = search.trim()
        if (category && category !== 'All' && category !== '') params.category = category
        if (city && city !== 'All' && city !== '') params.city = city
        if (coords && typeof coords.lat === 'number' && typeof coords.lon === 'number') {
          params.lat = coords.lat
          params.lon = coords.lon
          params.lng = coords.lng
        }
        const res = await storeService.getStores(params, { params, signal: controller.signal })
        if (!active) return
        setStores(Array.isArray(res) ? res : [])
        setError('')
      } catch (err) {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return
        console.error('Failed to fetch stores:', err)
        if (!active) return
        setError('Failed to load stores.')
        setStores([])
      } finally {
        if (active) setLoading(false)
      }
    }, 500) // debounce

    return () => {
      active = false
      controller.abort()
      clearTimeout(handler)
    }
  }, [search, category, city, coords?.lat, coords?.lon])

  // initialize from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const initialSearch = params.get('search') || ''
    const initialCategory = params.get('category') || ''
    const initialCity = params.get('city') || ''
    if (initialSearch) setSearch(initialSearch)
    if (initialCategory) setCategory(initialCategory)
    if (initialCity) setCity(initialCity)
  }, [location.search])

  // Try auto-detect city on first visit
  useEffect(() => {
    let active = true
    async function run() {
      try {
        // Skip if already selected via query or state
        if (city) return
        setDetectingCity(true)
        // Use cached city if available
        let cached = ''
        try { cached = localStorage.getItem('user_city') || '' } catch {}
        if (cached) {
          setCity(cached)
          return
        }
        const detected = await locationService.detectCityViaGeolocation()
        if (!active) return
        if (detected) {
          setCity(detected)
          try { localStorage.setItem('user_city', detected) } catch {}
        }
      } finally {
        if (active) setDetectingCity(false)
      }
    }
    run()
    return () => { active = false }
  }, [city])

  // Try auto-detect coords for nearby search
  useEffect(() => {
    let active = true
    async function run() {
      try {
        if (coords) return
        setDetectingCoords(true)
        let cached = null
        try { cached = JSON.parse(localStorage.getItem('user_coords') || 'null') } catch {}
        if (cached && typeof cached.lat === 'number' && typeof cached.lon === 'number') {
          setCoords(cached)
          return
        }
        const detected = await locationService.detectCoordsViaGeolocation()
        if (!active) return
        if (detected) {
          setCoords(detected)
          try { localStorage.setItem('user_coords', JSON.stringify(detected)) } catch {}
        }
      } finally {
        if (active) setDetectingCoords(false)
      }
    }
    run()
    return () => { active = false }
  }, [coords])

  // derive sorted view
  const sortedStores = useMemo(() => {
    const list = [...stores].filter(s => !minRating || Number(s.rating || 0) >= Number(minRating))
    if (sortBy === 'rating') {
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }
    if (sortBy === 'name') {
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }
    return list
  }, [stores, sortBy, minRating])

  // Announce loading and results
  useEffect(() => {
    if (loading) {
      announce('Loading stores…', 'polite')
    }
  }, [loading])

  useEffect(() => {
    if (loading) return
    if (error) {
      announce(`Error loading stores: ${error}`, 'polite')
      return
    }
    const scopeCity = city ? ` in ${city}` : ''
    const scopeCat = category ? ` for ${category}` : ''
    announce(sortedStores.length === 0 ? 'No stores found.' : `Found ${sortedStores.length} stores${scopeCity}${scopeCat}.`, 'polite')
  }, [loading, error, sortedStores.length, city, category])

  const isHospitalityCat = (c = '') => {
    const x = String(c).toLowerCase()
    return x.includes('hotel') || x.includes('hospitality') || x.includes('hospital')
  }
  const shopsStores = useMemo(() => sortedStores.filter(s => !isHospitalityCat(s.category || s.type)), [sortedStores])

  const isOpenNow = (hours) => {
    if (!hours || typeof hours !== 'object') return true
    const days = ['sun','mon','tue','wed','thu','fri','sat']
    const now = new Date()
    const key = days[now.getDay()]
    const today = hours[key]
    if (!today?.open || !today?.close) return true
    const [oh, om] = today.open.split(':').map(Number)
    const [ch, cm] = today.close.split(':').map(Number)
    const start = new Date(now); start.setHours(oh, om, 0, 0)
    const end = new Date(now); end.setHours(ch, cm, 0, 0)
    return now >= start && now <= end
  }

  const todayHoursLabel = (hours) => {
    if (!hours) return ''
    const days = ['sun','mon','tue','wed','thu','fri','sat']
    const now = new Date()
    const key = days[now.getDay()]
    const t = hours[key]
    if (!t?.open || !t?.close) return ''
    return `${t.open}–${t.close}`
  }

  return (
    <PageFade className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">Explore Local Stores</h1>
      <section role="region" aria-labelledby="stores-filters-heading" className="sticky top-16 z-10 bg-white/90 backdrop-blur rounded-xl shadow-sm p-3 mb-4">
        <h2 id="stores-filters-heading" className="sr-only">Store Filters</h2>
        <div className="flex flex-col gap-2">
          {(detectingCity || detectingCoords) && (
            <div className="text-xs text-gray-600">Detecting your location6hellip;</div>
          )}
          {/* Row 1: Search + Sort + CTA */}
          <div className="flex items-center gap-2 flex-wrap">
            <label htmlFor="stores-search" className="sr-only">Search stores</label>
            <input
              id="stores-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search stores"
              className="border rounded-full px-4 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            {/* Inline sort moved into drawer for cleaner layout */}
            <div role="group" aria-label="Sort stores" className="hidden rounded-full border overflow-hidden">
              <button
                type="button"
                onClick={() => setSortBy('')}
                aria-pressed={sortBy === ''}
                className={`px-3 py-2 text-sm ${sortBy === '' ? 'bg-brand-accent text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >Default</button>
              <button
                type="button"
                onClick={() => setSortBy('rating')}
                aria-pressed={sortBy === 'rating'}
                className={`px-3 py-2 text-sm border-l ${sortBy === 'rating' ? 'bg-brand-accent text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >Top Rated</button>
              <button
                type="button"
                onClick={() => setSortBy('name')}
                aria-pressed={sortBy === 'name'}
                className={`px-3 py-2 text-sm border-l ${sortBy === 'name' ? 'bg-brand-accent text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >Name A–Z</button>
            </div>
            {/* Filters toggle (mobile + desktop) */}
            <PressScale className="inline-block ml-auto">
              <button
                type="button"
                className="px-3 py-2 rounded-full border text-sm bg-white hover:bg-gray-50"
                aria-controls="stores-filters-drawer"
                aria-expanded={filtersOpen ? 'true' : 'false'}
                onClick={() => setFiltersOpen(true)}
              >Filters</button>
            </PressScale>
            {isAuthenticated && !(isSeller || isAdmin) && (
              <div className="ml-auto">
                <PressScale className="inline-block">
                  <Link
                    to="/onboard"
                    aria-label="Onboard your store"
                    className="inline-flex items-center justify-center px-3 py-2 rounded-full border border-brand-primary text-brand-primary hover:bg-orange-50 transition-colors text-sm"
                  >
                    Onboard Your Store
                  </Link>
                </PressScale>
              </div>
            )}
          </div>
          {/* Row 2 moved into drawer to reduce clutter on web */}
          <div className="hidden items-center gap-2 overflow-x-auto py-1">
            <div role="tablist" aria-label="Categories" className="flex items-center gap-2">
              {categories.map(c => {
                const active = (c === 'All' ? '' : c) === category
                return (
                  <button
                    key={c}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCategory(c === 'All' ? '' : c)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${active ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >{c}</button>
                )
              })}
            </div>
            <div className="flex items-center gap-2">
              {[0, 4.0, 4.5, 4.8].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setMinRating(r)}
                  aria-pressed={Number(minRating) === r}
                  className={`px-3 py-1.5 rounded-full text-sm border ${Number(minRating) === r ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {r === 0 ? 'All ratings' : `⭐ ${r}+`}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { setSearch(''); setCategory(''); setMinRating(0); setSortBy(''); announce('Filters reset.', 'polite') }}
              className="ml-auto px-3 py-1.5 rounded-full text-sm bg-gray-100 hover:bg-gray-200"
              aria-label="Reset filters"
            >Reset</button>
          </div>
        </div>
      </section>

      {/* Mobile Filters Drawer */}
      <DrawerRight
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        ariaLabel="Store Filters"
        id="stores-filters-drawer"
        widthClass="w-full sm:w-[380px]"
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button
              type="button"
              className="px-3 py-1.5 rounded-full text-sm bg-gray-100 hover:bg-gray-200"
              onClick={() => { setSearch(''); setCategory(''); setMinRating(0); setSortBy(''); announce('Filters reset.', 'polite') }}
              aria-label="Reset filters"
            >Reset</button>
          </div>
          <div className="mt-4 space-y-5">
            <div>
              <label className="text-sm font-medium">Sort</label>
              <div className="mt-1 text-xs text-gray-500">Selected: {sortBy === '' ? 'Default' : (sortBy === 'rating' ? 'Top Rated' : (sortBy === 'name' ? 'Name A–Z' : 'Default'))}</div>
              {/* controls on a separate line below the label */}
              <div role="group" aria-label="Sort stores" className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSortBy('')}
                  aria-pressed={sortBy === ''}
                  className={`px-3 py-1.5 text-sm rounded-full border ${sortBy === '' ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >Default</button>
                <button
                  type="button"
                  onClick={() => setSortBy('rating')}
                  aria-pressed={sortBy === 'rating'}
                  className={`px-3 py-1.5 text-sm rounded-full border ${sortBy === 'rating' ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >Top Rated</button>
                <button
                  type="button"
                  onClick={() => setSortBy('name')}
                  aria-pressed={sortBy === 'name'}
                  className={`px-3 py-1.5 text-sm rounded-full border ${sortBy === 'name' ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >Name A–Z</button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Categories</label>
              <div role="tablist" aria-label="Categories" className="mt-2 flex items-center gap-2 flex-wrap">
                {categories.map(c => {
                  const active = (c === 'All' ? '' : c) === category
                  return (
                    <button
                      key={c}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setCategory(c === 'All' ? '' : c)}
                      className={`px-3 py-1.5 rounded-full text-sm border ${active ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >{c}</button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Minimum Rating</label>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {[0, 4.0, 4.5, 4.8].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setMinRating(r)}
                    aria-pressed={Number(minRating) === r}
                    className={`px-3 py-1.5 rounded-full text-sm border ${Number(minRating) === r ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    {r === 0 ? 'All ratings' : `⭐ ${r}+`}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t mt-2">
              <button
                type="button"
                className="w-full px-3 py-2 rounded-md bg-brand-primary text-white"
                onClick={() => setFiltersOpen(false)}
              >Apply Filters</button>
            </div>
          </div>
        </div>
      </DrawerRight>

      {/* Coupon applied hint */}
      {(() => {
        let p = ''
        try { p = localStorage.getItem('promo') || '' } catch {}
        if (!p) return null
        return (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            Coupon applied: <span className="font-semibold">{p.toUpperCase()}</span>
          </div>
        )
      })()}

      <h2 id="stores-results-heading" className="sr-only">Store Results</h2>
      {loading ? (
        <div role="status" aria-live="polite" aria-busy="true" aria-label="Loading stores" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, idx) => (<SkeletonStoreCard key={idx} />))}
        </div>
      ) : error ? (
        <div role="alert" aria-live="assertive" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : sortedStores.length === 0 ? (
        <div role="status" aria-live="polite" className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          No stores found.
        </div>
      ) : (
        <ul role="list" aria-labelledby="stores-results-heading" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shopsStores.map(store => (
            <li key={store.id} className="list-none">
            <Link
              to={`/store/${store.id}`}
              aria-label={`View ${store.name} details`}
              className="block"
              onMouseEnter={() => { import('../pages/StoreDetail'); storeService.prefetchStoreDetail(store.id) }}
            >
              <HoverLiftCard className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-elev-2 transition-shadow duration-300 flex flex-col h-full">
                {store.image && (
                  <img
                    src={store.image}
                    alt={store.name}
                    className="w-full h-40 object-cover"
                    width="640"
                    height="360"
                    loading="lazy"
                    decoding="async"
                    fetchpriority="low"
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  />
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold truncate">{store.name}</h2>
                      <p className="text-gray-600 truncate">{store.category || store.type || 'General'}</p>
                    </div>
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium min-w-[56px]">⭐ {Number(typeof store.rating !== 'undefined' ? store.rating : 4.5).toFixed(1)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs min-h-[28px]">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">📍 {store.location || store.area || 'Nearby'}</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${isOpenNow(store.hours) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                      {isOpenNow(store.hours) ? 'Open now' : 'Closed'}
                    </span>
                    {todayHoursLabel(store.hours) && (
                      <span className="text-xs text-gray-600">Today: {todayHoursLabel(store.hours)}</span>
                    )}
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <div className="mt-2 h-px bg-gray-100" />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600">Explore products and offers</span>
                    <span className="inline-flex items-center gap-1 text-brand-accent text-sm">View Store
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  </div>
                </div>
              </HoverLiftCard>
            </Link>
            </li>
          ))}
        </ul>
      )}
    </PageFade>
  )
}