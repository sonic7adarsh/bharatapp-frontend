import React, { useEffect, useMemo, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format, addDays } from 'date-fns'

/**
 * DateRangePicker
 * Reusable calendar UI based on RoomBooking page.
 * Props:
 * - from: string (yyyy-MM-dd)
 * - to: string (yyyy-MM-dd)
 * - onChange: ({ from, to }) => void
 * - minDate: Date (defaults to today)
 * - className: optional wrapper class
 */
export default function DateRangePicker({ from, to, onChange, minDate, className = '' }) {
  const initialFrom = useMemo(() => {
    try { return from ? new Date(from) : new Date() } catch { return new Date() }
  }, [from])
  const initialTo = useMemo(() => {
    try {
      if (to) return new Date(to)
      return addDays(initialFrom, 1)
    } catch { return addDays(new Date(), 1) }
  }, [to, initialFrom])

  const [range, setRange] = useState({ from: initialFrom, to: initialTo })
  const [month, setMonth] = useState(range?.from || new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const popoverRef = useRef(null)

  useEffect(() => {
    const onDocClick = (e) => {
      if (!showCalendar) return
      const el = popoverRef.current
      if (el && !el.contains(e.target)) setShowCalendar(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showCalendar])

  useEffect(() => {
    try {
      const f = from ? new Date(from) : null
      const t = to ? new Date(to) : null
      if (f || t) {
        setRange({ from: f || range.from, to: t || range.to })
        if (f) setMonth(f)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to])

  const onSelectRange = (r) => {
    setRange(r || {})
    let nextFrom = from
    let nextTo = to
    if (r?.from) {
      try { nextFrom = format(r.from, 'yyyy-MM-dd') } catch {}
    }
    const coDate = r?.to ? r.to : (r?.from ? addDays(r.from, 1) : null)
    if (coDate) {
      try { nextTo = format(coDate, 'yyyy-MM-dd') } catch {}
    }
    if (onChange) onChange({ from: nextFrom, to: nextTo })
    if (r?.from) setShowCalendar(false)
  }

  const min = useMemo(() => minDate || new Date(), [minDate])
  const fromLabel = useMemo(() => {
    try { return from || format(range?.from || new Date(), 'yyyy-MM-dd') } catch { return '' }
  }, [from, range])
  const toLabel = useMemo(() => {
    try { return to || format(range?.to || addDays(new Date(), 1), 'yyyy-MM-dd') } catch { return '' }
  }, [to, range])

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">From</label>
          <input
            type="text"
            readOnly
            value={fromLabel}
            onClick={() => setShowCalendar(true)}
            className="w-full border rounded px-3 py-2 cursor-pointer"
            aria-haspopup="dialog"
            aria-expanded={showCalendar}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">To</label>
          <input
            type="text"
            readOnly
            value={toLabel}
            onClick={() => setShowCalendar(true)}
            className="w-full border rounded px-3 py-2 cursor-pointer"
            aria-haspopup="dialog"
            aria-expanded={showCalendar}
          />
        </div>
      </div>

      {showCalendar && (
        <div ref={popoverRef} className="fixed inset-0 z-50 sm:inset-auto sm:absolute sm:left-0 sm:mt-2 w-full sm:w-auto">
          {/* Backdrop for mobile */}
          <div className="block sm:hidden absolute inset-0 bg-black/30" onClick={() => setShowCalendar(false)} aria-hidden="true" />
          <div className="relative mx-auto sm:mx-0 max-w-[95vw] sm:max-w-none bg-white border sm:rounded-md shadow-lg p-2 sm:p-2">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={onSelectRange}
              month={month}
              onMonthChange={setMonth}
              captionLayout="buttons"
              disabled={{ before: min }}
              weekStartsOn={1}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" className="btn-outline px-3 py-2 text-xs sm:text-xs" onClick={() => setShowCalendar(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}