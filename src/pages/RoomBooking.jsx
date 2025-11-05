import React, { useEffect, useMemo, useState, useTransition } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { STORES } from '../data/stores'
import useAuth from '../hooks/useAuth'
import orderService from '../services/orderService'
import storeService from '../services/storeService'
import { PageFade, PressScale } from '../motion/presets'

export default function RoomBooking() {
  const { storeId, roomId } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const store = useMemo(() => STORES.find(s => s.id === storeId), [storeId])
  const room = useMemo(() => (store?.products || []).find(p => p.id === roomId), [store, roomId])
  const [checkIn, setCheckIn] = useState(() => new Date().toISOString().slice(0,10))
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0,10)
  })
  const [guests, setGuests] = useState(1)
  const [roomsGuests, setRoomsGuests] = useState([1])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState(1) // 1: dates & guests, 2: guest details
  const [isPending, startTransition] = useTransition()
  const [availability, setAvailability] = useState(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const nights = useMemo(() => {
    try {
      const ci = new Date(checkIn)
      const co = new Date(checkOut)
      const ms = co - ci
      const diff = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
      return diff
    } catch { return 1 }
  }, [checkIn, checkOut])

  const minCheckIn = useMemo(() => new Date().toISOString().slice(0,10), [])
  const minCheckOut = useMemo(() => { const d = new Date(checkIn); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10) }, [checkIn])

  // Keep check-out always at least one day after check-in
  useEffect(() => {
    const ci = new Date(checkIn)
    const co = new Date(checkOut)
    if (co <= ci) {
      const next = new Date(ci)
      next.setDate(ci.getDate() + 1)
      setCheckOut(next.toISOString().slice(0,10))
    }
  }, [checkIn])

  // Prefill guest details from authenticated user
  useEffect(() => {
    if (isAuthenticated && user) {
      if (!name && user.name) setName(user.name)
      if (!phone && (user.phone || user.mobile)) setPhone(user.phone || user.mobile)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    const total = roomsGuests.reduce((a, b) => a + b, 0)
    setGuests(total)
  }, [roomsGuests])

  // Remove global +/−; rely on per-room controls only

  const incRoom = (idx) => {
    setRoomsGuests(prev => {
      const next = [...prev]
      if (next[idx] < 3) {
        next[idx] += 1
      } else if (idx === next.length - 1) {
        // If last room is full, clicking + adds a new room
        next.push(1)
      }
      return next
    })
  }

  const decRoom = (idx) => {
    setRoomsGuests(prev => {
      const next = [...prev]
      if (next[idx] > 1) next[idx] -= 1
      else if (next.length > 1) next.splice(idx, 1)
      return next.length === 0 ? [1] : next
    })
  }

  if (!store || !room) {
    return (
      <PageFade className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>Room not found.</p>
        </div>
        <div className="mt-4"><Link to={`/store/${storeId}`} className="link-brand">Back to Store</Link></div>
      </PageFade>
    )
  }

  const confirmBooking = async () => {
    if (!name || !phone || !checkIn || !checkOut || guests < 1) {
      setError('Please fill guest details, dates, and guest count')
      return
    }
    setLoading(true)
    setError('')
    try {
      const totals = availability ? {
        perNight: availability.base,
        nights: availability.nights,
        subtotal: availability.subtotal,
        taxes: availability.taxes,
        fees: availability.fees,
        payable: availability.total
      } : { perNight: Number(room.price) || 0, nights, payable: (Number(room.price) || 0) * nights }
      const payload = {
        type: 'room_booking',
        store: { id: storeId, name: store.name },
        room: { id: room.id, name: room.name, price: Number(room.price) || 0 },
        booking: {
          checkIn,
          checkOut,
          guests,
          nights,
          rooms: availability?.rooms || 1,
          perRoomMax: availability?.perRoomMax || 3,
          extraMattressAllowed: !!availability?.extraMattressAllowed,
          extraMattressCount: availability?.extraMattressCount || 0,
          mattressFeePerNight: availability?.mattressFeePerNight || 0,
          roomsGuests
        },
        guest: { name, phone },
        notes,
        totals
      }
      const data = await orderService.checkout(payload)
      const orderId = data?.order?.id
      startTransition(() => {
        if (orderId) {
          navigate(`/orders/${orderId}`)
        } else {
          setSuccess(true)
        }
      })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Booking failed. Please try again.'
      setError(msg)
      console.error('Booking error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckAvailability = async () => {
    setError('')
    // Basic validation first
    if (!checkIn || !checkOut) {
      setError('Please select valid check-in and check-out dates')
      return
    }
    if (guests < 1) {
      setError('Please enter a valid number of guests')
      return
    }
    setCheckingAvailability(true)
    try {
      const res = await storeService.checkRoomAvailability({
        storeId,
        roomId,
        checkIn,
        checkOut,
        guests,
        roomsGuests
      })
      if (!res?.available) {
        setAvailability(null)
        setError(res?.reason || 'Room not available for selected dates')
        return
      }
      setAvailability(res)
      startTransition(() => setStep(2))
    } catch (e) {
      console.error('Availability error', e)
      setError('Unable to check availability right now. Please try again.')
    } finally {
      setCheckingAvailability(false)
    }
  }

  if (success) {
    return (
      <PageFade className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          <h2 className="text-2xl font-bold">Booking Confirmed</h2>
          <p className="mt-2">Your room has been booked successfully.</p>
        </div>
        <div className="mt-6 flex items-center space-x-4">
          <PressScale className="inline-block">
            <button onClick={() => navigate(`/store/${storeId}`)} className="btn-primary">Back to Store</button>
          </PressScale>
          <Link to="/" className="link-brand">Go Home</Link>
        </div>
      </PageFade>
    )
  }

  return (
    <PageFade className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold">Book: {room.name}</h2>
      <p className="text-gray-600 mt-1">{store.name} • {store.area}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${step === 1 ? 'bg-brand-muted text-brand-accent' : 'bg-gray-100 text-gray-700'}`}>Step 1: Dates & Guests</span>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${step === 2 ? 'bg-brand-muted text-brand-accent' : 'bg-gray-100 text-gray-700'}`}>Step 2: Guest Details</span>
      </div>

      {/* Gallery and Details */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-4">
          {room.image ? (
            <img
              src={room.image}
              alt={room.name}
              loading="lazy"
              decoding="async"
              width="800"
              height="400"
              fetchpriority="low"
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="w-full h-64 object-cover rounded-md"
            />
          ) : (
            <div className="w-full h-64 rounded-md bg-gray-100 flex items-center justify-center text-gray-500">No photo available</div>
          )}
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Room Details</h3>
            <p className="text-gray-700 text-sm">{room.description || 'Comfortable room with essential amenities.'}</p>
            <ul className="mt-3 text-sm text-gray-700 list-disc ml-5">
              <li>Free Wi-Fi</li>
              <li>Air Conditioning</li>
              <li>Breakfast included</li>
              <li>Flexible cancellation (24h)</li>
            </ul>
          </div>
        </div>
        
        {/* Booking Form */}
        <div className="bg-white rounded-lg shadow-sm p-4" aria-busy={loading || isPending}>
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">{error}</div>
          )}
          {step === 1 ? (
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Check-in</label>
                <input type="date" value={checkIn} min={minCheckIn} onChange={e => setCheckIn(e.target.value)} className="border rounded px-3 py-2 w-full" disabled={loading} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Check-out</label>
                <input type="date" value={checkOut} min={minCheckOut} onChange={e => setCheckOut(e.target.value)} className="border rounded px-3 py-2 w-full" disabled={loading} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Guests</label>
                <div className="mt-1 text-xs text-gray-600">Max 3 guests per room. Use +/− per room; adding beyond 3 creates a new room.</div>
                <div className="mt-3 space-y-2">
                  {roomsGuests.map((g, idx) => (
                    <div key={idx} className="flex items-center justify-between border rounded-md px-3 py-2">
                      <span className="text-sm font-medium">Room {idx + 1}</span>
                      <div className="inline-flex items-center rounded-md bg-gray-50 border">
                        <button type="button" onClick={() => decRoom(idx)} className="px-2 py-1 text-lg font-bold hover:bg-gray-100" disabled={loading}>-</button>
                        <span className="px-3 text-sm">{g} guest{g > 1 ? 's' : ''}</span>
                        <button type="button" onClick={() => incRoom(idx)} className="px-2 py-1 text-lg font-bold hover:bg-gray-100" disabled={loading}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-600">When a room has 3 guests, an extra mattress is added if allowed.</p>
              </div>
              <PressScale className="inline-block">
                <button type="button" onClick={handleCheckAvailability} className="btn-primary w-full" disabled={checkingAvailability}>
                  {checkingAvailability ? 'Checking availability...' : 'Check availability'}
                </button>
              </PressScale>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Guest Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="border rounded px-3 py-2 w-full" disabled={loading} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="border rounded px-3 py-2 w-full" disabled={loading} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Special Requests</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="border rounded px-3 py-2 w-full min-h-[80px]" disabled={loading} />
              </div>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">Back</button>
                <PressScale className="inline-block">
                  <button onClick={confirmBooking} disabled={loading} className="btn-primary">
                    {loading ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </PressScale>
              </div>
            </div>
          )}
          {/* summary moved to separate sticky card */}
          {step === 1 && (
            <div className="mt-3 text-center">
              <Link to={`/store/${storeId}`} className="link-brand">Back to Store</Link>
            </div>
          )}
          {step === 2 && (
            <div className="mt-3 text-center">
              <Link to={`/store/${storeId}`} className="link-brand">Back to Store</Link>
            </div>
          )}
        </div>
        {/* Sticky Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:sticky md:top-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Your Stay</h3>
            {availability ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">Available</span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">Estimate</span>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {availability ? (
              <>
                <div className="flex justify-between"><span>Rooms required</span><span className="font-semibold">{availability.rooms}</span></div>
                <div className="flex justify-between"><span>Max guests per room</span><span className="font-semibold">{availability.perRoomMax}</span></div>
                {Array.isArray(availability.roomsGuests) && availability.roomsGuests.length > 0 && (
                  <div className="mt-1">
                    <div className="text-sm font-medium mb-1">Room allocation</div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {availability.roomsGuests.map((g, i) => (
                        <li key={i} className="flex justify-between">
                          <span>Room {i + 1}</span>
                          <span className="font-semibold">{g} guest{g > 1 ? 's' : ''}{availability.extraMattressAllowed && g === 3 ? ' + extra mattress' : ''}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {availability.extraMattressAllowed && (
                  <div className="flex justify-between"><span>Extra mattress (count)</span><span className="font-semibold">{availability.extraMattressCount} × ₹{availability.mattressFeePerNight}/night</span></div>
                )}
                <div className="flex justify-between"><span>Price per night</span><span className="font-semibold">₹{availability.base}</span></div>
                <div className="flex justify-between"><span>Nights</span><span className="font-semibold">{availability.nights}</span></div>
                <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold">₹{availability.subtotal}</span></div>
                <div className="flex justify-between"><span>Taxes (10%)</span><span className="font-semibold">₹{availability.taxes}</span></div>
                <div className="flex justify-between"><span>Service fee (5%)</span><span className="font-semibold">₹{availability.fees}</span></div>
                <div className="flex justify-between pt-2 border-t"><span>Total payable</span><span className="text-xl font-bold text-brand-accent">₹{availability.total}</span></div>
              </>
            ) : (
              <>
                <div className="flex justify-between"><span>Price per night</span><span className="font-semibold">₹{Number(room.price).toFixed(0)}</span></div>
                <div className="flex justify-between"><span>Nights</span><span className="font-semibold">{nights}</span></div>
                <div className="flex justify-between pt-2 border-t"><span>Estimated total</span><span className="text-xl font-bold text-brand-accent">₹{((Number(room.price)||0) * nights).toFixed(0)}</span></div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageFade>
  )
}