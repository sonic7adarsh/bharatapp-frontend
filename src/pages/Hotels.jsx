import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { STORES } from '../data/stores'
import { SkeletonStoreCard } from '../components/Skeletons'
import storeService from '../services/storeService'
import locationService from '../services/locationService'
import { PageFade, HoverLiftCard, PressScale, DrawerRight } from '../motion/presets'
import { useAnnouncer } from '../context/AnnouncerContext'
import useAuth from '../hooks/useAuth'

export default function Hotels() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [detectingCity, setDetectingCity] = useState(false)
  const [sortBy, setSortBy] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const location = useLocation()
  const { announce } = useAnnouncer()
  const { isSeller, isAdmin } = useAuth()

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setLoading(true)
    const handler = setTimeout(async () => {
      try {
        const params = { category: 'Hotels' }
        if (search.trim()) params.search = search.trim()
        if (city && city !== 'All' && city !== '') params.city = city
        const res = await storeService.getStores(params, { params, signal: controller.signal })
        if (!active) return
        setStores(Array.isArray(res) ? res : [])
        setError('')
      } catch (err) {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return
        console.error('Failed to fetch hotels:', err)
        if (!active) return
        const q = (search || '').toLowerCase()
        const filtered = STORES.filter(s => isHospitalityCat(s.category || s.type)).filter(s => {
          const matchName = s.name.toLowerCase().includes(q)
          const sourceCity = (s.location || s.area || '').toLowerCase()
          const matchCity = city && city !== 'All' && city !== '' ? sourceCity.includes(city.toLowerCase()) : true
          return matchName && matchCity
        })
        setStores(filtered)
        setError('')
      } finally {
        if (active) setLoading(false)
      }
    }, 400)

    return () => { active = false; controller.abort(); clearTimeout(handler) }
  }, [search, city])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const initialSearch = params.get('search') || ''
    const initialCity = params.get('city') || ''
    if (initialSearch) setSearch(initialSearch)
    if (initialCity) setCity(initialCity)
  }, [location.search])

  useEffect(() => {
    let active = true
    async function run() {
      try {
        if (city) return
        setDetectingCity(true)
        let cached = ''
        try { cached = localStorage.getItem('user_city') || '' } catch {}
        if (cached) { setCity(cached); return }
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

  const isHospitalityCat = (c = '') => {
    const x = String(c).toLowerCase()
    return x.includes('hotel') || x.includes('hospitality') || x.includes('hospital')
  }

  const sortedStores = useMemo(() => {
    const list = [...stores].filter(s => !minRating || Number(s.rating || 0) >= Number(minRating))
    if (sortBy === 'rating') return list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    if (sortBy === 'name') return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return list
  }, [stores, sortBy, minRating])

  useEffect(() => {
    if (loading) {
      announce('Loading hotels…', 'polite')
      return
    }
    if (error) {
      announce(`Error loading hotels: ${error}`, 'polite')
      return
    }
    const scopeCity = city ? ` in ${city}` : ''
    announce(sortedStores.length === 0 ? 'No hotels found.' : `Found ${sortedStores.length} hotels${scopeCity}.`, 'polite')
  }, [loading, error, sortedStores.length, city])

  return (
    <PageFade className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">Explore Local Hotels</h1>
      <section role="region" aria-labelledby="hotels-filters-heading" className="sticky top-16 z-10 bg-white/90 backdrop-blur rounded-xl shadow-sm p-3 mb-4">
        <h2 id="hotels-filters-heading" className="sr-only">Hotel Filters</h2>
        <div className="flex flex-col gap-2">
          {/* Row 1: Search + Sort + CTA */}
          <div className="flex items-center gap-2 flex-wrap">
            <label htmlFor="hotels-search" className="sr-only">Search hotels</label>
            <input
              id="hotels-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search hotels"
              className="border rounded-full px-4 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            {/* Inline sort moved into drawer for consistency with Stores */}
            <div role="group" aria-label="Sort hotels" className="hidden rounded-full border overflow-hidden">
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
                aria-controls="hotels-filters-drawer"
                aria-expanded={filtersOpen ? 'true' : 'false'}
                onClick={() => setFiltersOpen(true)}
              >Filters</button>
            </PressScale>
            {(isSeller || isAdmin) && (
              <PressScale className="inline-block ml-auto">
                <Link to="/onboard" className="inline-flex items-center justify-center px-3 py-2 rounded-full border border-brand-primary text-brand-primary hover:bg-orange-50 transition-colors text-sm">List Your Hotel</Link>
              </PressScale>
            )}
          </div>
          {/* Row 2: Ratings + Reset */}
          {/* Row 2 moved into drawer to reduce clutter on web */}
          <div className="hidden items-center gap-2 overflow-x-auto py-1">
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
              onClick={() => { setSearch(''); setMinRating(0); setSortBy(''); announce('Filters reset.', 'polite') }}
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
        ariaLabel="Hotel Filters"
        id="hotels-filters-drawer"
        widthClass="w-full sm:w-[380px]"
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button
              type="button"
              className="px-3 py-1.5 rounded-full text-sm bg-gray-100 hover:bg-gray-200"
              onClick={() => { setSearch(''); setMinRating(0); setSortBy(''); setCity(''); announce('Filters reset.', 'polite') }}
              aria-label="Reset filters"
            >Reset</button>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Sort</label>
              <div className="mt-1 text-xs text-gray-500">Selected: {sortBy === '' ? 'Default' : (sortBy === 'rating' ? 'Top Rated' : (sortBy === 'name' ? 'Name A–Z' : 'Default'))}</div>
              {/* controls on a separate line below the label */}
              <div role="group" aria-label="Sort hotels" className="mt-2 flex flex-wrap gap-2">
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
            <div className="pt-2">
              <button
                type="button"
                className="w-full px-3 py-2 rounded-md bg-brand-primary text-white"
                onClick={() => setFiltersOpen(false)}
              >Apply Filters</button>
            </div>
          </div>
        </div>
      </DrawerRight>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, idx) => (<SkeletonStoreCard key={idx} />))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
      ) : sortedStores.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">No hotels found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedStores.map(store => (
            <Link
              to={`/store/${store.id}`}
              key={store.id}
              className="block"
              onMouseEnter={() => { import('../pages/StoreDetail'); import('../pages/RoomBooking'); storeService.prefetchStoreDetail(store.id) }}
            >
              <HoverLiftCard className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-elev-2 transition-shadow duration-300">
                {store.image && (
                  <img
                    src={store.image}
                    alt={store.name}
                    loading="lazy"
                    decoding="async"
                    width="640"
                    height="320"
                    fetchpriority="low"
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">{store.name}</h2>
                      <p className="text-gray-600">{store.category || store.type}</p>
                    </div>
                    {typeof store.rating !== 'undefined' && (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium min-w-[56px]">⭐ {Number(store.rating).toFixed(1)}</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {(store.area || store.location) && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">📍 {store.area || store.location}</span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">🏨 Hospitality</span>
                  </div>
                  <div className="mt-3 text-gray-500 text-xs">Check today’s availability →</div>
                </div>
                <div className="px-4 pb-4">
                  <div className="mt-2 h-px bg-gray-100" />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Explore rooms and amenities</span>
                    <span className="inline-flex items-center text-brand-accent text-sm">View Rooms →</span>
                  </div>
                </div>
              </HoverLiftCard>
            </Link>
          ))}
        </div>
      )}
    </PageFade>
  )
}