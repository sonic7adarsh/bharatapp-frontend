import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { STORES } from '../data/stores'
import { SkeletonStoreCard } from '../components/Skeletons'
import storeService from '../services/storeService'
import locationService from '../services/locationService'
import { PageFade, HoverLiftCard, PressScale } from '../motion/presets'

export default function Hotels() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [detectingCity, setDetectingCity] = useState(false)
  const [sortBy, setSortBy] = useState('')
  const [minRating, setMinRating] = useState(0)
  const location = useLocation()

  useEffect(() => {
    let active = true
    setLoading(true)
    const handler = setTimeout(async () => {
      try {
        const params = { category: 'Hotels' }
        if (search.trim()) params.search = search.trim()
        if (city && city !== 'All' && city !== '') params.city = city
        const res = await storeService.getStores(params)
        if (!active) return
        setStores(Array.isArray(res) ? res : [])
        setError('')
      } catch (err) {
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

    return () => { active = false; clearTimeout(handler) }
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

  return (
    <PageFade className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">Explore Local Hotels</h1>
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search hotels by name..."
            className="border rounded px-3 py-2 w-full"
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="border rounded px-3 py-2 w-full text-sm"
          >
            <option value="">Sort</option>
            <option value="rating">Top Rated</option>
            <option value="name">Name A–Z</option>
          </select>
          <select
            value={minRating}
            onChange={e => setMinRating(Number(e.target.value))}
            className="border rounded px-3 py-2 w-full text-sm"
          >
            {[0, 4.0, 4.5, 4.8].map(r => (
              <option key={r} value={r}>{r === 0 ? 'All ratings' : `${r}+`}</option>
            ))}
          </select>
          <PressScale className="inline-block">
            <Link to="/onboard" className="btn-primary">List Your Hotel</Link>
          </PressScale>
        </div>
      </div>

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
              onMouseEnter={() => { import('../pages/StoreDetail') }}
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
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">⭐ {store.rating}</span>
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