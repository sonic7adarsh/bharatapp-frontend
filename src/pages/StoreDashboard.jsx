import React, { useEffect, useMemo, useState } from 'react'
import { SkeletonDashboard } from '../components/Skeletons'
import { PageFade, PressScale } from '../motion/presets'
import { Link } from 'react-router-dom'
import { useAnnouncer } from '../context/AnnouncerContext'

export default function StoreDashboard() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [periodDays, setPeriodDays] = useState(7)
  const { announce } = useAnnouncer()

  useEffect(() => {
    // Simulate loading and read local orders (seeded in dev)
    const t = setTimeout(() => {
      let local = []
      try {
        const raw = localStorage.getItem('orders')
        local = raw ? JSON.parse(raw) : []
      } catch {}
      setOrders(Array.isArray(local) ? local : [])
      setLoading(false)
    }, 400)
    return () => clearTimeout(t)
  }, [])
  const metrics = useMemo(() => {
    const totalOrders = orders.length
    const revenue = orders.reduce((sum, o) => sum + Number(o.total || o.totals?.payable || 0), 0)
    const subtotal = orders.reduce((sum, o) => sum + Number(o.totals?.subtotal || 0), 0)
    const avgOrderValue = totalOrders ? revenue / totalOrders : 0
    const itemsSold = orders.reduce((sum, o) => sum + (o.items || []).reduce((s, it) => s + Number(it.quantity || 0), 0), 0)
    const pmCounts = orders.reduce((acc, o) => {
      const pm = (o.paymentMethod || 'cod').toLowerCase()
      acc[pm] = (acc[pm] || 0) + 1
      return acc
    }, {})
    const productMap = new Map()
    orders.forEach(o => (o.items || []).forEach(it => {
      const key = it.name || it.id
      const prev = productMap.get(key) || { units: 0, revenue: 0, id: it.id, name: it.name }
      prev.units += Number(it.quantity || 0)
      prev.revenue += Number(it.price || 0) * Number(it.quantity || 0)
      productMap.set(key, prev)
    }))
    const topProducts = Array.from(productMap.values()).sort((a, b) => b.units - a.units).slice(0, 6)
    // Build daily order counts for the selected period
    const today = new Date()
    const days = [...Array(periodDays)].map((_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - ((periodDays - 1) - i))
      const key = d.toISOString().slice(0,10)
      const dayOrders = orders.filter(o => String(o.createdAt || o.date || '').slice(0,10) === key)
      const count = dayOrders.length
      const payable = dayOrders.reduce((sum, o) => sum + Number(o.total || o.totals?.payable || 0), 0)
      return { key, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), count, payable }
    })
    const maxCount = Math.max(1, ...days.map(d => d.count))
    // Revenue growth: current period vs previous period
    const startCurrent = new Date(today)
    startCurrent.setDate(today.getDate() - (periodDays - 1))
    const endPrev = new Date(startCurrent)
    endPrev.setDate(startCurrent.getDate() - 1)
    const startPrev = new Date(endPrev)
    startPrev.setDate(endPrev.getDate() - (periodDays - 1))
    const inRange = (date, start, end) => {
      const d = new Date(date)
      const ds = new Date(start)
      const de = new Date(end)
      return d >= ds && d <= de
    }
    const currRevenue = orders
      .filter(o => inRange(o.createdAt || o.date || today, startCurrent, today))
      .reduce((sum, o) => sum + Number(o.total || o.totals?.payable || 0), 0)
    const prevRevenue = orders
      .filter(o => inRange(o.createdAt || o.date || today, startPrev, endPrev))
      .reduce((sum, o) => sum + Number(o.total || o.totals?.payable || 0), 0)
    const growthPct = prevRevenue > 0 ? ((currRevenue - prevRevenue) / prevRevenue) * 100 : (currRevenue > 0 ? 100 : 0)
    return { totalOrders, revenue, avgOrderValue, itemsSold, topProducts, subtotal, pmCounts, days, maxCount, currRevenue, prevRevenue, growthPct }
  }, [orders, periodDays])

  // Announce revenue growth direction when period or growth changes
  useEffect(() => {
    if (loading) return
    const dir = metrics.growthPct >= 0 ? 'up' : 'down'
    const pct = Math.abs(metrics.growthPct).toFixed(1)
    announce(`Revenue ${dir} ${pct}% versus previous ${periodDays} days.`, 'polite')
  }, [metrics.growthPct, periodDays, loading, announce])

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-6" aria-busy="true">
        <div role="status" aria-live="polite" className="sr-only">Loading store dashboard…</div>
        <SkeletonDashboard />
      </main>
    )
  }

  return (
    <PageFade className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Store Dashboard</h1>
        <div className="flex items-center gap-3">
          <PressScale className="inline-block">
            <Link to="/products/add" className="btn-primary">Add Product</Link>
          </PressScale>
          <PressScale className="inline-block">
            <Link to="/orders" className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50">View Orders</Link>
          </PressScale>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="card-dashboard p-4 bg-white rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Total Orders</div>
          <div className="text-2xl font-bold mt-1">{metrics.totalOrders}</div>
        </div>
        <div className="card-dashboard p-4 bg-white rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Revenue</div>
          <div className="text-2xl font-bold mt-1">₹{metrics.revenue.toFixed(0)}</div>
        </div>
        <div className="card-dashboard p-4 bg-white rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Avg Order Value</div>
          <div className="text-2xl font-bold mt-1">₹{metrics.avgOrderValue.toFixed(0)}</div>
        </div>
        <div className="card-dashboard p-4 bg-white rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Items Sold</div>
          <div className="text-2xl font-bold mt-1">{metrics.itemsSold}</div>
        </div>
      </div>

      {/* Period & Growth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Sales Period</div>
            <div className="flex gap-2">
              {[7, 30].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPeriodDays(p); announce(`Sales period set to ${p} days.`, 'polite') }}
                  className={`px-3 py-1.5 rounded-full text-sm border ${periodDays === p ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  aria-label={`Show last ${p} days`}
                  aria-pressed={periodDays === p}
                >
                  Last {p}d
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-600 mt-2">Current period revenue: ₹{metrics.currRevenue.toFixed(0)}</div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Revenue Growth</div>
          <div className={`text-2xl font-bold mt-1 ${metrics.growthPct >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {metrics.growthPct >= 0 ? '▲' : '▼'} {Math.abs(metrics.growthPct).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">vs previous {periodDays}d (₹{metrics.prevRevenue.toFixed(0)})</div>
        </div>
      </div>

      {/* Status Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">COD Orders</div>
          <div className="text-xl font-bold mt-1">{metrics.pmCounts.cod || 0}</div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Online Orders</div>
          <div className="text-xl font-bold mt-1">{metrics.pmCounts.online || 0}</div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Subtotal (all orders)</div>
          <div className="text-xl font-bold mt-1">₹{metrics.subtotal.toFixed(0)}</div>
        </div>
      </div>

      {/* Sales Trend */}
      <section className="bg-white rounded-lg shadow-sm mt-8" aria-labelledby="sales-trend-heading">
        <div id="sales-trend-heading" className="p-4 border-b font-semibold">Sales Trend (last {periodDays} days)</div>
        <div className="p-4">
          <div className="flex items-end gap-2 h-28">
            {metrics.days.map(d => (
              <div key={d.key} className="flex flex-col items-center justify-end">
                <div
                  className="w-8 bg-brand-accent/70 hover:bg-brand-accent transition-all"
                  style={{ height: `${Math.max(8, Math.round((d.count / metrics.maxCount) * 100))}%` }}
                  aria-hidden="true"
                  title={`${d.label}: ${d.count}`}
                />
                <div className="text-[11px] text-gray-600 mt-1">{d.label}</div>
              </div>
            ))}
          </div>
          <ul className="sr-only" aria-label={`Sales trend values for last ${periodDays} days`}>
            {metrics.days.map(d => (
              <li key={`sr-${d.key}`}>{d.label}: ₹{Number(d.payable || 0).toFixed(0)} with {d.count} orders</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow-sm mt-8">
        <div className="p-4 border-b font-semibold">Top Products</div>
        {metrics.topProducts.length === 0 ? (
          <div className="p-4 text-gray-600">No product performance available.</div>
        ) : (
          <div className="p-4 overflow-x-auto">
            <table role="table" aria-label="Top products" className="min-w-full text-sm">
              <thead>
                <tr role="row" className="text-left text-gray-600">
                  <th role="columnheader" scope="col" className="pb-2 pr-4">Product</th>
                  <th role="columnheader" scope="col" className="pb-2 pr-4">Units</th>
                  <th role="columnheader" scope="col" className="pb-2 pr-4">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topProducts.map(p => (
                  <tr role="row" key={p.id} className="border-t">
                    <td role="cell" className="py-2 pr-4 font-medium">{p.name}</td>
                    <td role="cell" className="py-2 pr-4">{p.units}</td>
                    <td role="cell" className="py-2 pr-4">₹{p.revenue.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Helpful Links */}
      <div className="mt-8 flex items-center gap-3">
        <Link to="/products/add-open" className="link-brand">Public Add Product</Link>
        <span className="text-gray-400">•</span>
        <Link to="/stores" className="link-brand">Browse Stores</Link>
      </div>
    </PageFade>
  )
}
