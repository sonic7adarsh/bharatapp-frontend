import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import storeService from '../services/storeService'
import { STORES } from '../data/stores'
import useCart from '../context/CartContext'
import QuickViewModal from '../components/QuickViewModal'
import { SkeletonStoreHeader, SkeletonProductCard } from '../components/Skeletons'
import { PageFade, PressScale } from '../motion/presets'

export default function StoreDetail() {
  const { id } = useParams()
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [storeError, setStoreError] = useState(null)
  const [productsError, setProductsError] = useState(null)
  const { addItem, updateItemQuantity, removeItem, items, itemsCount, totalPrice } = useCart()
  const [addingId, setAddingId] = useState(null)
  const [quickProduct, setQuickProduct] = useState(null)
  const [quickOpen, setQuickOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const filteredProducts = useMemo(() => {
    const q = (productSearch || '').toLowerCase()
    if (!q) return products
    return products.filter(p => (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
  }, [products, productSearch])

  useEffect(() => {
    const fetchStoreDetails = async () => {
      try {
        setLoading(true)
        
        // Fetch store details
        const fetchedStore = await storeService.getStore(id)
        if (fetchedStore) {
          setStore(fetchedStore)
          setStoreError(null)
        } else {
          setStoreError('Failed to load store details. Please try again later.')
        }
        
        // Fetch store products
        const fetchedProducts = await storeService.getProductsByStore(id)
        if (Array.isArray(fetchedProducts)) {
          setProducts(fetchedProducts)
          setProductsError(null)
        } else {
          setProductsError('Failed to load products. Please try again later.')
        }
      } catch (error) {
        console.error('Error fetching store details:', error)
        
        // Handle API errors
        if (error.response?.status === 404) {
          setStoreError('Store not found')
        } else {
          setStoreError('Failed to load store details. Please try again later.')
        }
        
        // Fallback to local data if available
        const localStore = STORES.find(s => s.id === id)
        if (localStore) {
          setStore(localStore)
          setProducts(localStore.products || [])
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStoreDetails()
  }, [id])

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <SkeletonStoreHeader />
        <section className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (<SkeletonProductCard key={idx} />))}
          </div>
        </section>
      </main>
    )
  }

  if (storeError && !store) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-md mb-6">
          <p className="font-medium">Error</p>
          <p>{storeError}</p>
        </div>
        <Link to="/stores" className="link-brand font-medium">
          &larr; Back to Stores
        </Link>
      </main>
    )
  }

  return (
    <PageFade className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link to="/stores" className="text-sm link-brand" aria-label="Back to Stores">
          &larr; Back to Stores
        </Link>
      </div>
      {/* Store Header */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              {store.category && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                  {store.category}
                </span>
              )}
              {(store.area || store.city) && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                  {store.area || store.city}
                </span>
              )}
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium min-w-[56px]">⭐ {Number(typeof store.rating !== 'undefined' ? store.rating : 4.5).toFixed(1)}</span>
            </div>
            <p className="mt-3 text-gray-700">
              {store.address || store.area || 'Location information not available'}
            </p>
            <StoreOpenBadge hours={store.hours} />
          </div>

          <div className="mt-4 md:mt-0">
            <button type="button" className="inline-flex items-center px-4 py-2 rounded-md border border-brand-primary text-brand-primary hover:bg-orange-50 transition-colors" aria-label="Contact Store">
              Contact Store
            </button>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <h2 className="text-2xl font-bold">Products</h2>
          <div className="flex-1 md:max-w-sm">
            <label htmlFor="product-search" className="sr-only">Search products</label>
            <input
              id="product-search"
              type="text"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              placeholder="Search products by name or description"
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          {productsError && (
            <p className="text-red-600 text-sm">{productsError}</p>
          )}
        </div>

        {products.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
            <p className="font-medium">No products available for this store.</p>
            <p className="mt-1 text-sm">Please check back later or explore other stores.</p>
            <div className="mt-3">
              <Link to="/stores" className="link-brand font-medium">Browse Stores</Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onQuick={() => { setQuickProduct(product); setQuickOpen(true) }}
                storeId={id}
                storeCategory={store?.category}
              />
            ))}
          </div>
        )}
      </section>

      {/* Sticky Cart Bar removed: Floating cart button already provides summary */}

      {/* Quick View Modal */}
      <QuickViewModal isOpen={quickOpen} onClose={() => setQuickOpen(false)} product={quickProduct} storeOpen={(() => {
        const h = store?.hours
        if (!h) return true
        const days = ['sun','mon','tue','wed','thu','fri','sat']
        const now = new Date()
        const key = days[now.getDay()]
        const t = h[key]
        if (!t?.open || !t?.close) return true
        const [oh, om] = String(t.open).split(':').map(Number)
        const [ch, cm] = String(t.close).split(':').map(Number)
        const start = new Date(now); start.setHours(oh, om, 0, 0)
        const end = new Date(now); end.setHours(ch, cm, 0, 0)
        return now >= start && now <= end
      })()} storeCategory={store?.category} storeId={id} />
    </PageFade>
  )
}

function ProductCard({ product, onQuick, storeId, storeCategory }) {
  const [avail, setAvail] = useState({ status: 'unknown', reason: '' })
  const isHospitality = () => {
    const c = String(storeCategory || '').toLowerCase()
    return c.includes('hotel') || c.includes('hospitality') || c.includes('residency')
  }
  const prefetchBooking = () => { import('../pages/RoomBooking') }
  const checkQuickAvailability = async () => {
    if (!isHospitality() || avail.status !== 'unknown') return
    setAvail({ status: 'checking', reason: '' })
    try {
      const today = new Date().toISOString().slice(0,10)
      const tmr = (() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10) })()
      const res = await storeService.checkRoomAvailability({
        storeId,
        roomId: product.id,
        checkIn: today,
        checkOut: tmr,
        guests: 2
      })
      if (res?.available) setAvail({ status: 'available', reason: '' })
      else setAvail({ status: 'unavailable', reason: res?.reason || '' })
    } catch (e) {
      setAvail({ status: 'unknown', reason: '' })
    }
  }
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col h-full" onMouseEnter={checkQuickAvailability}>
      {product.image && (
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width="640"
          height="360"
          fetchpriority="low"
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="w-full h-40 md:h-48 object-cover rounded-md mb-3 cursor-pointer"
          onClick={onQuick}
        />
      )}
      <h3 className="font-semibold text-lg cursor-pointer" onClick={onQuick}>{product.name}</h3>
      {/* Minimal card: show a single-line description only */}
      {product.description ? (
        <p className="text-gray-600 text-sm mt-1 truncate">{product.description}</p>
      ) : null}
      {isHospitality() && (
        <div className="mt-2 text-xs">
          {avail.status === 'available' && (
            <span className="px-2 py-0.5 rounded bg-green-100 text-green-700">Likely available today</span>
          )}
          {avail.status === 'unavailable' && (
            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">Not available today</span>
          )}
          {avail.status === 'checking' && (
            <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Checking availability…</span>
          )}
        </div>
      )}

      <div className="mt-auto pt-3 flex justify-between items-center">
        <span className="font-bold text-lg">₹{Number(product?.price || 0).toFixed(0)}</span>
        <PressScale className="inline-block">
          <button
            onClick={onQuick}
            className="ml-2 px-3 py-1 rounded-md text-sm bg-brand-muted text-brand-accent hover:bg-orange-100"
          >
            Quick View
          </button>
        </PressScale>
        {isHospitality() && (
          <PressScale className="inline-block">
            <Link
              to={`/book/${storeId}/${product.id}`}
              onMouseEnter={prefetchBooking}
              className="ml-2 px-3 py-1 rounded-md text-sm bg-brand-primary text-white hover:bg-brand-primaryDark"
            >
              Book Room
            </Link>
          </PressScale>
        )}
      </div>
    </div>
  )
}

function StoreOpenBadge({ hours }) {
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
  const open = isOpenNow(hours)
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${open ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
        {open ? 'Open now' : 'Closed'}
      </span>
      {todayHoursLabel(hours) && (
        <span className="text-xs text-gray-600">Today: {todayHoursLabel(hours)}</span>
      )}
    </div>
  )
}
