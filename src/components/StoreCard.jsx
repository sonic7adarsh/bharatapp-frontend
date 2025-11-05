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
    <HoverLiftCard className="border rounded-brand-lg p-4 shadow-elev-1 hover:shadow-elev-2 transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{store.name}</h3>
          <p className="text-sm text-gray-600">{store.area}</p>
          {city ? (
            <div className="mt-1 text-xs text-green-700">Delivers to {city} · ETA ~{etaRange}m</div>
          ) : null}
        </div>
        <div className="text-sm text-yellow-600">⭐ {store.rating}</div>
      </div>

      <div className="mt-3 space-y-2">
        {(store.products ? store.products : []).slice(0,3).map(p => (
          <div key={p.id} className="flex justify-between text-sm">
            <div>{p.name}</div>
            <div>₹{p.price}</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <PressScale className="inline-block">
          <Link to={`/store/${store.id}`} className="btn-primary">View</Link>
        </PressScale>
      </div>
    </HoverLiftCard>
  )
}
