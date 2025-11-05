import React from 'react'
import { Link } from 'react-router-dom'
import { HoverLiftCard, PressScale } from '../motion/presets'

export default function StoreCard({ store }) {
  const city = (() => {
    try { return localStorage.getItem('user_city') || '' } catch { return '' }
  })()
  const etaRange = (() => {
    const rating = Number(store.rating || 4)
    const base = Math.max(15, Math.round(35 - Math.min(5, Math.max(0, rating)) * 3))
    return `${base}-${base + 10}`
  })()
  return (
    <HoverLiftCard className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-elev-2 transition-shadow duration-300">
      {store.image && (
        <img src={store.image} alt={store.name} className="w-full h-40 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{store.name}</h3>
            <p className="text-sm text-gray-600">{store.category || store.type}</p>
          </div>
          {typeof store.rating !== 'undefined' && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">⭐ {store.rating}</span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {(store.area || store.location) && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">📍 {store.area || store.location}</span>
          )}
          {city && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700">Delivers to {city} · ~{etaRange}m</span>
          )}
        </div>

        <div className="mt-3 space-y-2">
          {(store.products ? store.products : []).slice(0,3).map(p => (
            <div key={p.id} className="flex justify-between text-sm">
              <div>{p.name}</div>
              <div>₹{p.price}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="mt-2 h-px bg-gray-100" />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">Explore products and offers</span>
          <PressScale className="inline-block">
            <Link to={`/store/${store.id}`} className="text-brand-accent text-sm hover:underline">View Store →</Link>
          </PressScale>
        </div>
      </div>
    </HoverLiftCard>
  )
}
