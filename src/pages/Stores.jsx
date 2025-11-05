import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { STORES } from '../data/stores'
import { SkeletonStoreCard } from '../components/Skeletons'
import storeService from '../services/storeService'
import locationService from '../services/locationService'
import { PageFade, HoverLiftCard, PressScale } from '../motion/presets'

export default function Stores() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [city, setCity] = useState('')
  const [detectingCity, setDetectingCity] = useState(false)
  const [sortBy, setSortBy] = useState('')
  const location = useLocation()

  const categories = useMemo(() => (
    ['All', 'Grocery', 'Electronics', 'Fashion', 'Healthcare']
  ), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    const handler = setTimeout(async () => {
      try {
        const params = {}
        if (search.trim()) params.search = search.trim()
        if (category && category !== 'All' && category !== '') params.category = category
        if (city && city !== 'All' && city !== '') params.city = city
        const res = await storeService.getStores(params)
        if (!active) return
        setStores(Array.isArray(res) ? res : [])
        setError('')
      } catch (err) {
        console.error('Failed to fetch stores:', err)
        if (!active) return
        // Fallback to local sample data so the page remains usable
        const q = (search || '').toLowerCase()
        const filtered = STORES.filter(s => {
          const matchName = s.name.toLowerCase().includes(q)
          const matchCat = category && category !== 'All' && category !== '' ? (s.category || '').toLowerCase() === category.toLowerCase() : true
          const sourceCity = (s.location || s.area || '').toLowerCase()
          const matchCity = city && city !== 'All' && city !== '' ? sourceCity.includes(city.toLowerCase()) : true
          return matchName && matchCat && matchCity
        })
        setStores(filtered)
        setError('')
      } finally {
        if (active) setLoading(false)
      }
    }, 500) // debounce

    return () => {
      active = false
      clearTimeout(handler)
    }
  }, [search, category])

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
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label htmlFor="stores-search" className="sr-only">Search stores</label>
            <input
              id="stores-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by store name"
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label htmlFor="stores-category" className="sr-only">Category</label>
            <select
              id="stores-category"
              value={category}
              onChange={e => setCategory(e.target.value === 'All' ? '' : e.target.value)}
              className="border rounded px-3 py-2 w-full text-sm"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="stores-city" className="sr-only">City</label>
            <input
              id="stores-city"
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder={detectingCity && !city ? 'Detecting city…' : 'City (optional)'}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label htmlFor="stores-sort" className="sr-only">Sort by</label>
            <select
              id="stores-sort"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="border rounded px-3 py-2 w-full text-sm"
            >
              <option value="">Sort</option>
              <option value="rating">Top Rated</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
          <PressScale className="inline-block">
            <Link
              to="/onboard"
              aria-label="Onboard your store"
              className="inline-flex items-center justify-center px-3 py-2 rounded-md border border-brand-primary text-brand-primary hover:bg-orange-50 transition-colors text-sm"
            >
              Onboard Your Store
            </Link>
          </PressScale>
        </div>
        {/* Rating filters */}
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          {[0, 4.0, 4.5, 4.8].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setMinRating(r)}
              aria-pressed={Number(minRating) === r}
              className={`px-3 py-1 rounded-full text-sm border focus:outline-none focus:ring-2 focus:ring-brand-primary ${Number(minRating) === r ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              {r === 0 ? 'All ratings' : `${r}+`}
            </button>
          ))}
        </div>
      </div>

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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, idx) => (<SkeletonStoreCard key={idx} />))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : sortedStores.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          No stores found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shopsStores.map(store => (
            <Link to={`/store/${store.id}`} key={store.id} className="block">
              <HoverLiftCard className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-elev-2 transition-shadow duration-300 flex flex-col h-full">
                {store.image && (
                  <img src={store.image} alt={store.name} className="w-full h-40 object-cover" />
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
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Explore products and offers</span>
                    <PressScale className="inline-block">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-md border border-brand-primary text-brand-primary text-sm hover:bg-orange-50">View Store</span>
                    </PressScale>
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