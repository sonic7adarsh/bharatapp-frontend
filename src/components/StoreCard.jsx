import React from 'react'
import { Link } from 'react-router-dom'

export default function StoreCard({ store }) {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{store.name}</h3>
          <p className="text-sm text-gray-600">{store.area}</p>
        </div>
        <div className="text-sm text-yellow-600">⭐ {store.rating}</div>
      </div>

      <div className="mt-3 space-y-2">
        {store.products.slice(0,3).map(p => (
          <div key={p.id} className="flex justify-between text-sm">
            <div>{p.name}</div>
            <div>₹{p.price}</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Link to={`/store/${store.id}`} className="inline-block px-3 py-1 bg-indigo-600 text-white rounded">View</Link>
      </div>
    </div>
  )
}
