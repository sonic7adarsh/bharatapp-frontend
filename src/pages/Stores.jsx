import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { STORES } from '../data/stores'
import { SkeletonStoreCard } from '../components/Skeletons'
import storeService from '../services/storeService'
import locationService from '../services/locationService'

export default function Stores() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
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
    const list = [...stores]
    if (sortBy === 'rating') {
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    }
    if (sortBy === 'name') {
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }
    return list
  }, [stores, sortBy])

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">Explore Local Stores</h1>
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by store name..."
            className="border rounded px-3 py-2 w-full"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value === 'All' ? '' : e.target.value)}
            className="border rounded px-3 py-2 w-full text-sm"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="border rounded px-3 py-2 w-full text-sm"
          >
            <option value="">Sort</option>
            <option value="rating">Top Rated</option>
            <option value="name">Name A–Z</option>
          </select>
          <Link
            to="/onboard"
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Onboard Your Store
          </Link>
        </div>
      </div>

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
          {sortedStores.map(store => (
            <Link to={`/store/${store.id}`} key={store.id} className="block">
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                {store.image && (
                  <img src={store.image} alt={store.name} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <h2 className="text-xl font-semibold">{store.name}</h2>
                  <p className="text-gray-600">{store.category || store.type}</p>
                  {typeof store.rating !== 'undefined' && (
                    <p className="text-yellow-600 text-sm mt-1">⭐ {store.rating}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">{store.location || store.area}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}