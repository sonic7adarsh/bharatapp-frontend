import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import storeService from '../services/storeService'
import useCart from '../context/CartContext'
import QuickViewModal from '../components/QuickViewModal'
import { SkeletonStoreHeader, SkeletonProductCard } from '../components/Skeletons'
import { PageFade, PressScale } from '../motion/presets'
import { useAnnouncer } from '../context/AnnouncerContext'

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
  const { announce } = useAnnouncer()
  const filteredProducts = useMemo(() => {
    const q = (productSearch || '').toLowerCase()
    if (!q) return products
    return products.filter(p => (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
  }, [products, productSearch])

  useEffect(() => {
    const controller = new AbortController()
    const fetchStoreDetails = async () => {
      try {
        setLoading(true)
        
        // Use prefetched cache first for faster paint
        const cachedStore = storeService.getCachedStore(id)
        if (cachedStore) {
          setStore(cachedStore)
          setStoreError(null)
        }
        const cachedProducts = storeService.getCachedProducts(id)
        if (Array.isArray(cachedProducts)) {
          setProducts(cachedProducts)
          setProductsError(null)
        }

        // Fetch store details
        const fetchedStore = await storeService.getStore(id, { signal: controller.signal })
        if (fetchedStore) {
          setStore(fetchedStore)
          setStoreError(null)
        } else {
          setStoreError('Failed to load store details. Please try again later.')
        }
        
        // Fetch store products
        const fetchedProducts = await storeService.getProductsByStore(id, { signal: controller.signal })
        if (Array.isArray(fetchedProducts)) {
          setProducts(fetchedProducts)
          setProductsError(null)
        } else {
          setProductsError('Failed to load products. Please try again later.')
        }
      } catch (error) {
        if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') return
        console.error('Error fetching store details:', error)
        
        // Handle API errors
        if (error.response?.status === 404) {
          setStoreError('Store not found')
        } else {
          setStoreError('Failed to load store details. Please try again later.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStoreDetails()
    return () => { controller.abort() }
  }, [id])

  // Announce loading and results
  useEffect(() => {
    if (loading) {
      announce('Loading store details…', 'polite')
      return
    }
    if (storeError && !store) {
      announce(`Error loading store: ${storeError}`, 'polite')
      return
    }
    if (store) {
      const count = Array.isArray(products) ? products.length : 0
      announce(count === 0 ? `Loaded ${store.name}. No products available.` : `Loaded ${store.name}. ${count} products available.`, 'polite')
    }
  }, [loading, storeError, store, products.length])

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8" aria-busy="true">
        <SkeletonStoreHeader />
        <section className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
          <div role="status" aria-live="polite" aria-label="Loading products" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (<SkeletonProductCard key={idx} />))}
          </div>
        </section>
      </main>
    )
  }

  if (storeError && !store) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div role="alert" aria-live="assertive" className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-md mb-6">
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
            <h1 className="text-3xl font-bold text-gray-900">{store?.name || 'Store'}</h1>
            <div className="mt-2 flex items-center gap-2">
              {store?.category && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                  {store?.category}
                </span>
              )}
              {(store.area || store.city) && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                  {store.area || store.city}
                </span>
              )}
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium min-w-[56px]">⭐ {Number(typeof store?.rating !== 'undefined' ? store?.rating : 4.5).toFixed(1)}</span>
            </div>
            <p className="mt-3 text-gray-700">
              {store?.address || store?.area || 'Location information not available'}
            </p>
            <StoreOpenBadge hours={store?.hours} />
            {(() => {
              const isClosed = Boolean(store?.orderingDisabled) || String(store?.status || '').toLowerCase() === 'closed' || Boolean(store?.closed)
              if (!isClosed) return null
              const until = store?.closedUntil ? new Date(store.closedUntil) : null
              const reason = store?.closedReason
              return (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded" role="status" aria-live="polite">
                  <div className="font-medium">Store is currently closed</div>
                  <div className="text-sm">{reason ? `Reason: ${reason}. ` : ''}{until ? `Reopens by ${until.toLocaleString()}.` : ''}</div>
                </div>
              )
            })()}
          </div>

          <div className="mt-4 md:mt-0">
            <button type="button" className="inline-flex items-center px-4 py-2 rounded-md border border-brand-primary text-brand-primary hover:bg-orange-50 transition-colors" aria-label="Contact Store">
              Contact Store
            </button>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <section aria-labelledby="store-products-heading">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <h2 id="store-products-heading" className="text-2xl font-bold">Products</h2>
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
          <div role="status" aria-live="polite" className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
            <p className="font-medium">No products available for this store.</p>
            <p className="mt-1 text-sm">Please check back later or explore other stores.</p>
            <div className="mt-3">
              <Link to="/stores" className="link-brand font-medium">Browse Stores</Link>
            </div>
          </div>
        ) : (
          <ul role="list" aria-labelledby="store-products-heading" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <li key={product.id} className="list-none">
                <ProductCard
                  product={product}
                  onQuick={() => { setQuickProduct(product); setQuickOpen(true) }}
                  storeId={id}
                  storeCategory={store?.category}
                />
              </li>
            ))}
          </ul>
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
      })()} storeCategory={store?.category} storeId={id} storeClosed={Boolean(store?.orderingDisabled) || String(store?.status || '').toLowerCase() === 'closed' || Boolean(store?.closed)} />
    </PageFade>
  )
}

function ProductCard({ product, onQuick, storeId, storeCategory }) {
  const [avail, setAvail] = useState({ status: 'unknown', reason: '' })
  const isHospitality = () => {
    const c = String(storeCategory || '').toLowerCase()
    const pc = String(product?.category || '').toLowerCase()
    return c.includes('hotel') || c.includes('hospitality') || c.includes('residency') || pc === 'room' || pc.includes('room')
  }

  // Normalize product image across possible backend schemas
  const getProductImage = (p) => {
    if (!p) return ''
    const direct = p.image || p.imageUrl || p.thumbnail || p.thumbUrl || p.photoUrl || p.picture || p.imgUrl
    if (direct) return direct
    const fromImages = Array.isArray(p.images) ? (typeof p.images[0] === 'string' ? p.images[0] : (p.images[0]?.url || '')) : ''
    if (fromImages) return fromImages
    const fromMedia = Array.isArray(p.media) ? (typeof p.media[0] === 'string' ? p.media[0] : (p.media[0]?.url || '')) : ''
    if (fromMedia) return fromMedia
    // Local/platform fallback stored as data URL
    const dataUrl = p.imageDataUrl || p.image_data_url || ''
    return dataUrl || ''
  }
  const imageSrc = getProductImage(product)
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
      {imageSrc ? (
        <img
          src={imageSrc}
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
      ) : (
        <div
          className="w-full h-40 md:h-48 rounded-md mb-3 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 cursor-pointer"
          onClick={onQuick}
          aria-label="No image available"
        >
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z"/><path d="M21 15l-5-5-4 4-2-2-5 5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8" cy="8" r="2"/></svg>
        </div>
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
