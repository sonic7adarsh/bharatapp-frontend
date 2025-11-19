import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useCart from '../context/CartContext'
import { ModalSlideUp } from '../motion/presets'
import { useAnnouncer } from '../context/AnnouncerContext'

export default function QuickViewModal({ isOpen, onClose, product, storeOpen = true, storeCategory, storeId, storeClosed = false }) {
  const { addItem, items, updateItemQuantity, removeItem } = useCart()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [variantKey, setVariantKey] = useState('standard')
  const [addonKeys, setAddonKeys] = useState(new Set())
  const { announce } = useAnnouncer()

  const category = String(storeCategory || product?.storeCategory || '').toLowerCase()
  const isPharmacy = category.includes('pharmacy')
  const isHospitality = category.includes('hospital') || category.includes('hotel') || category.includes('hospitality')

  // Hospitality booking moved to dedicated RoomBooking page; no dates/guests here

  useEffect(() => {
    if (!product) return
    const cartItem = items.find(i => i.id === product.id)
    setQty(cartItem?.quantity || 1)
  }, [product, items])

  // Announce modal open with product name and store state
  useEffect(() => {
    if (!isOpen) return
    const name = product?.name || 'product'
    const closedNote = storeClosed ? ' Store is closed for ordering.' : (!storeOpen ? ' Store is currently closed.' : '')
    announce(`Quick view opened for ${name}.${closedNote}`, 'polite')
  }, [isOpen])

  // Prefetch RoomBooking chunk when viewing hospitality product to reduce navigation lag
  useEffect(() => {
    if (isHospitality) {
      import('../pages/RoomBooking').catch(() => {})
    }
  }, [isHospitality])

  const variants = useMemo(() => {
    // Pharmacy: only show product-provided variants (e.g., pack size), otherwise none
    if (isPharmacy) return Array.isArray(product?.variants) && product.variants.length > 0 ? product.variants : []
    const preset = [
      { key: 'standard', label: 'Standard', delta: 0 },
      { key: 'premium', label: 'Premium', delta: 20 },
      { key: 'deluxe', label: 'Deluxe', delta: 40 },
    ]
    return Array.isArray(product?.variants) && product.variants.length > 0 ? product.variants : preset
  }, [product, isPharmacy])

  const addons = useMemo(() => {
    // Pharmacy: only product-provided addons; otherwise none
    if (isPharmacy) return Array.isArray(product?.addons) && product.addons.length > 0 ? product.addons : []
    const preset = [
      { key: 'gift_wrap', label: 'Gift wrap', price: 10 },
      { key: 'extra_pack', label: 'Extra pack', price: 30 },
      { key: 'priority_pick', label: 'Priority pick', price: 15 },
    ]
    return Array.isArray(product?.addons) && product.addons.length > 0 ? product.addons : preset
  }, [product, isPharmacy])

  const variantDelta = useMemo(() => {
    const v = variants.find(v => v.key === variantKey)
    return Number(v?.delta || v?.priceDelta || 0)
  }, [variants, variantKey])

  const addonsTotal = useMemo(() => {
    let sum = 0
    addons.forEach(a => {
      if (addonKeys.has(a.key)) sum += Number(a.price || a.cost || 0)
    })
    return sum
  }, [addons, addonKeys])

  const unitPrice = useMemo(() => {
    const base = Number(product?.price || 0) + variantDelta + addonsTotal
    // Hospitality total will be computed on booking page; show per-night/base price here
    return base
  }, [product, variantDelta, addonsTotal])

  if (!product) return null

  const addToCart = () => {
    if (isHospitality) {
      if (storeId && product?.id) navigate(`/book/${storeId}/${product.id}`)
      onClose?.()
      return
    }
    if (qty <= 0) return
    const suffixParts = []
    if (variantKey && variantKey !== 'standard') suffixParts.push(variants.find(v => v.key === variantKey)?.label || variantKey)
    if (addonKeys.size > 0) suffixParts.push(...addons.filter(a => addonKeys.has(a.key)).map(a => a.label))
    const name = suffixParts.length > 0 ? `${product.name} (${suffixParts.join(', ')})` : product.name
    let id = `${product.id}__v:${variantKey}__a:${[...addonKeys].sort().join(',')}`
    // Tag pharmacy items so Checkout can require prescription only when needed
    addItem({ id, name, price: unitPrice, requiresPrescription: isPharmacy, storeId }, qty)
    announce(`Added to cart: ${name}, quantity ${qty}.`, 'polite')
    onClose?.()
  }

  const dec = () => {
    const next = qty - 1
    if (next <= 0) setQty(0)
    else setQty(next)
  }
  const inc = () => setQty(qty + 1)

  return (
    <ModalSlideUp isOpen={isOpen} onClose={onClose} ariaLabel={`Quick view for ${product?.name || 'product'}`}>
      <div className="p-4">
        {storeClosed && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded">
            Store is closed for new orders. Please check back later.
          </div>
        )}
        {!storeOpen && (
          <div className="mb-3 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded">
            Store is currently closed. Orders will be scheduled for next opening.
          </div>
        )}
        {isPharmacy && (
          <div className="mb-3 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded">
            This is a pharmacy. Prescription will be required at checkout for medicines.
          </div>
        )}
        <div className="flex items-start gap-4">
          {(() => {
            const src = (product?.image || product?.imageUrl || product?.thumbnail || product?.thumbUrl || product?.photoUrl || product?.picture || product?.imgUrl || (Array.isArray(product?.images) ? (typeof product.images[0] === 'string' ? product.images[0] : (product.images[0]?.url || '')) : '') || (Array.isArray(product?.media) ? (typeof product.media[0] === 'string' ? product.media[0] : (product.media[0]?.url || '')) : '') || product?.imageDataUrl || product?.image_data_url || '')
            if (src) {
              return <img src={src} alt={product.name} loading="lazy" decoding="async" width={96} height={96} className="w-24 h-24 object-cover rounded-md" />
            }
            return (
              <div className="w-24 h-24 rounded-md bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400" aria-label="No image available">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z"/><path d="M21 15l-5-5-4 4-2-2-5 5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8" cy="8" r="2"/></svg>
              </div>
            )
          })()}
          <div className="flex-1">
            <div className="font-semibold text-lg">{product.name}</div>
            <div className="text-gray-600 text-sm mt-1 line-clamp-3">{product.description || 'No description available'}</div>
            <div className="mt-2 font-bold text-xl">₹{Number(unitPrice).toFixed(0)}</div>
          </div>
        </div>

        {isHospitality && (
          <div className="mt-4 text-sm text-gray-700">
            <div className="font-semibold mb-2">Room Facilities</div>
            <ul className="list-disc ml-5 space-y-1">
              <li>Free Wi‑Fi and Air Conditioning</li>
              <li>Breakfast included and Room Service</li>
              <li>Smart TV and Complimentary Toiletries</li>
              <li>On‑site Parking and 24x7 Reception</li>
              <li>Early check‑in on request (subject to availability)</li>
            </ul>
            <div className="mt-3 text-xs text-gray-600">
              Capacity: Max 3 guests per room. If guests exceed 3, an additional room is added automatically. Extra mattress provided where allowed.
            </div>
          </div>
        )}

        {/* Variants (hidden for Pharmacy and Hospitality unless product provides specific variants) */}
        {(!isPharmacy && !isHospitality && variants.length > 0) && (
          <div className="mt-4">
            <div className="font-semibold mb-2">Choose Variant</div>
            <div className="flex flex-wrap gap-2">
              {variants.map(v => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setVariantKey(v.key)}
                  className={`px-3 py-1 rounded-full text-sm border ${variantKey === v.key ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  aria-label={`Select ${v.label}`}
                >
                  {v.label}{Number(v.delta || v.priceDelta || 0) > 0 ? ` +₹${Number(v.delta || v.priceDelta).toFixed(0)}` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add-ons (hidden for Pharmacy and Hospitality unless product provides specific add-ons) */}
        {(!isPharmacy && !isHospitality && addons.length > 0) && (
          <div className="mt-4">
            <div className="font-semibold mb-2">Add-ons</div>
            <div className="flex flex-wrap gap-2">
              {addons.map(a => {
                const selected = addonKeys.has(a.key)
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => {
                      setAddonKeys(prev => {
                        const next = new Set(prev)
                        if (next.has(a.key)) next.delete(a.key)
                        else next.add(a.key)
                        return next
                      })
                    }}
                    className={`px-3 py-1 rounded-full text-sm border ${selected ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    aria-pressed={selected}
                    aria-label={`${selected ? 'Remove' : 'Add'} ${a.label}`}
                  >
                    {a.label} +₹{Number(a.price || a.cost || 0).toFixed(0)}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          {!isHospitality ? (
            <>
              <div className="inline-flex items-center bg-brand-muted text-brand-accent rounded-md">
                <button onClick={dec} className="px-3 py-1 hover:bg-orange-100 rounded-l-md" aria-label="Decrease quantity">−</button>
                <span className="px-3 py-1 font-semibold">{qty}</span>
                <button onClick={inc} className="px-3 py-1 hover:bg-orange-100 rounded-r-md" aria-label="Increase quantity">+</button>
              </div>
              <button onClick={addToCart} disabled={qty <= 0 || storeClosed} className="btn-primary">Add to Cart</button>
            </>
          ) : (
            <div className="text-sm text-gray-600">
              Explore full details and photos on the room page.
            </div>
          )}
        </div>
      </div>
    </ModalSlideUp>
  )
}