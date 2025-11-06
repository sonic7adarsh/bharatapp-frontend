import React from 'react'
import { Link } from 'react-router-dom'
import { HoverLiftCard, PressScale } from '../motion/presets'

export default function StoreCard({ store }) {
  const city = (() => {
    try { return localStorage.getItem('user_city') || '' } catch { return '' }
  })()
  const ratingValue = typeof store.rating !== 'undefined' ? store.rating : 4.5
  const etaRange = (() => {
    const rating = Number(ratingValue || 4.5)
    const base = Math.max(15, Math.round(35 - Math.min(5, Math.max(0, rating)) * 3))
    return `${base}-${base + 10}`
  })()
  const locationLabel = store.area || store.location || 'Nearby'
  return (
    <HoverLiftCard
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-elev-2 transition-shadow duration-300 flex flex-col h-full"
      role="article"
      aria-labelledby={`store-${store.id}-name`}
    >
      {store.image ? (
        <img
          src={store.image}
          alt={`${store.name} storefront`}
          className="w-full h-40 object-cover"
          width="640"
          height="360"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-40 bg-gray-100" aria-hidden="true" />
      )}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 id={`store-${store.id}-name`} className="font-semibold text-lg truncate">{store.name}</h3>
            <p className="text-sm text-gray-600 truncate">{store.category || store.type || 'General'}</p>
          </div>
          <span className="ml-2 inline-flex items-center justify-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium min-w-[56px]">
            <span aria-hidden="true">⭐</span> <span className="sr-only">Rating</span> {Number(ratingValue).toFixed(1)}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs min-h-[28px]">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700"><span aria-hidden="true">📍</span> {locationLabel}</span>
          {city && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700" aria-label={`Delivers to ${city}, approximately ${etaRange} minutes`}>
              Delivers to {city} · ~{etaRange}m
            </span>
          )}
        </div>

        <div className="mt-3 space-y-2 min-h-[56px]">
          {(store.products ? store.products : []).slice(0,2).map(p => (
            <div key={p.id} className="flex justify-between text-sm">
              <div className="truncate mr-2">{p.name}</div>
              <div className="shrink-0">₹{p.price}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="mt-2 h-px bg-gray-100" />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-sm text-gray-600">Explore products and offers</span>
          <PressScale className="inline-block">
            <Link
              to={`/store/${store.id}`}
              className="inline-flex items-center gap-1 text-brand-accent text-sm hover:underline"
              aria-label={`View store ${store.name}`}
              onMouseEnter={async () => { import('../pages/StoreDetail'); try { const svc = (await import('../services/storeService')).default; svc.prefetchStoreDetail(store.id) } catch {} }}
              onFocus={async () => { import('../pages/StoreDetail'); try { const svc = (await import('../services/storeService')).default; svc.prefetchStoreDetail(store.id) } catch {} }}
              onTouchStart={async () => { import('../pages/StoreDetail'); try { const svc = (await import('../services/storeService')).default; svc.prefetchStoreDetail(store.id) } catch {} }}
            >
              <span>View Store</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </PressScale>
        </div>
      </div>
    </HoverLiftCard>
  )
}
