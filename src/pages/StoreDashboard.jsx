import React, { useEffect, useMemo, useState } from 'react'
import { SkeletonDashboard } from '../components/Skeletons'
import { PageFade, PressScale } from '../motion/presets'
import { Link } from 'react-router-dom'
import { useAnnouncer } from '../context/AnnouncerContext'
import sellerService from '../services/sellerService'
import { useI18n } from '../context/I18nContext'

export default function StoreDashboard() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [periodDays, setPeriodDays] = useState(7)
  const { announce } = useAnnouncer()
  const [stores, setStores] = useState([])
  const [storesLoading, setStoresLoading] = useState(true)
  const { t } = useI18n()

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      try {
        // Try seller orders (across all seller stores)
        const remote = await sellerService.getOrders({})
        if (!active) return
        if (Array.isArray(remote) && remote.length >= 0) {
          setOrders(remote)
          setLoading(false)
          return
        }
      } catch {}
      // Fallback: local seeded orders from checkout flows
      try {
        const raw = localStorage.getItem('orders')
        const local = raw ? JSON.parse(raw) : []
        if (!active) return
        setOrders(Array.isArray(local) ? local : [])
      } catch {
        if (!active) return
        setOrders([])
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])
  
  // Whether current seller has hospitality/bookings capability (must be top-level hook)
  const allowBookingsManagement = useMemo(() => {
    const isHospitality = stores.some(s => {
      const cat = String(s?.category || s?.type || '').toLowerCase()
      return cat.includes('hotel') || cat.includes('hospitality') || cat.includes('residency')
    })
    const hasBookingsCapability = stores.some(s => s?.capabilities?.bookings === true)
    return isHospitality || hasBookingsCapability
  }, [stores])

  // Load seller-owned stores to allow toggling open/close
  useEffect(() => {
    let cancelled = false
    setStoresLoading(true)
    ;(async () => {
      try {
        const data = await sellerService.getSellerStores()
        if (!cancelled) setStores(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setStores([])
      } finally {
        if (!cancelled) setStoresLoading(false)
      }
    })()
    return () => { cancelled = true }
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
        <h1 className="text-2xl font-bold">{t('dashboard.title', 'Store Dashboard')}</h1>
        <div className="flex items-center gap-2">
          <PressScale className="inline-block">
            <Link to="/products/add" className="btn-primary text-sm">{t('dashboard.add_product', 'Add Product')}</Link>
          </PressScale>
          <PressScale className="inline-block">
            <Link to="/seller/products" className="btn-primary text-sm">{t('dashboard.manage_products', 'Manage Products')}</Link>
          </PressScale>
          <PressScale className="inline-block">
            <Link to="/seller/orders" className="btn-primary text-sm">{t('dashboard.manage_seller_orders', 'Manage Seller Orders')}</Link>
          </PressScale>
          {allowBookingsManagement && (
            <PressScale className="inline-block">
              <Link to="/seller/bookings" className="px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 text-sm">{t('dashboard.manage_bookings', 'Manage Bookings')}</Link>
            </PressScale>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="card-dashboard p-4 bg-white rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">{t('dashboard.total_orders', 'Total Orders')}</div>
          <div className="text-2xl font-bold mt-1">{metrics.totalOrders}</div>
        </div>
        <div className="card-dashboard p-4 bg-white rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">{t('dashboard.revenue', 'Revenue')}</div>
          <div className="text-2xl font-bold mt-1">₹{metrics.revenue.toFixed(0)}</div>
        </div>
        <div className="card-dashboard p-4 bg-white rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">{t('dashboard.avg_order_value', 'Avg Order Value')}</div>
          <div className="text-2xl font-bold mt-1">₹{metrics.avgOrderValue.toFixed(0)}</div>
        </div>
        <div className="card-dashboard p-4 bg-white rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">{t('dashboard.items_sold', 'Items Sold')}</div>
          <div className="text-2xl font-bold mt-1">{metrics.itemsSold}</div>
        </div>
      </div>

      {/* Period & Growth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">{t('dashboard.sales_period', 'Sales Period')}</div>
            <div className="flex gap-2">
              {[7, 30].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPeriodDays(p); announce(`Sales period set to ${p} days.`, 'polite') }}
                  className={`px-3 py-1.5 rounded-full text-sm border ${periodDays === p ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  aria-label={`${t('dashboard.show_last', 'Show last')} ${p} ${t('dashboard.days', 'days')}`}
                  aria-pressed={periodDays === p}
                >
                  {t('dashboard.last', 'Last')} {p}d
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-600 mt-2">{t('dashboard.current_period_revenue', 'Current period revenue')}: ₹{metrics.currRevenue.toFixed(0)}</div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">{t('dashboard.revenue_growth', 'Revenue Growth')}</div>
          <div className={`text-2xl font-bold mt-1 ${metrics.growthPct >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {metrics.growthPct >= 0 ? '▲' : '▼'} {Math.abs(metrics.growthPct).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">{t('dashboard.vs_previous', 'vs previous')} {periodDays}d (₹{metrics.prevRevenue.toFixed(0)})</div>
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
        <div id="sales-trend-heading" className="p-4 border-b font-semibold">{t('dashboard.sales_trend', 'Sales Trend')} ({t('dashboard.last', 'last')} {periodDays} {t('dashboard.days', 'days')})</div>
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
          <ul className="sr-only" aria-label={`${t('dashboard.sales_trend_values', 'Sales trend values for last')} ${periodDays} ${t('dashboard.days', 'days')}`}>
            {metrics.days.map(d => (
              <li key={`sr-${d.key}`}>{d.label}: ₹{Number(d.payable || 0).toFixed(0)} with {d.count} orders</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow-sm mt-8">
        <div className="p-4 border-b font-semibold">{t('dashboard.top_products', 'Top Products')}</div>
        {metrics.topProducts.length === 0 ? (
          <div className="p-4 text-gray-600">{t('dashboard.no_product_performance', 'No product performance available.')}</div>
        ) : (
          <div className="p-4 overflow-x-auto">
            <table role="table" aria-label="Top products" className="min-w-full text-sm">
              <thead>
                <tr role="row" className="text-left text-gray-600">
                  <th role="columnheader" scope="col" className="pb-2 pr-4">{t('dashboard.product', 'Product')}</th>
                  <th role="columnheader" scope="col" className="pb-2 pr-4">{t('dashboard.units', 'Units')}</th>
                  <th role="columnheader" scope="col" className="pb-2 pr-4">{t('dashboard.revenue', 'Revenue')}</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topProducts.map(p => (
                  <tr role="row" key={p.id} className="border-t even:bg-gray-50">
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
        <Link to="/products/add-open" className="link-brand">{t('dashboard.public_add_product', 'Public Add Product')}</Link>
        <span className="text-gray-400">•</span>
        <Link to="/stores" className="link-brand">{t('dashboard.browse_stores', 'Browse Stores')}</Link>
      </div>

      {/* Store Status */}
      <div className="mt-8 bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b font-semibold">{t('dashboard.store_status', 'Store Status')}</div>
        {storesLoading ? (
          <div className="p-4 text-sm text-gray-600">{t('dashboard.loading_stores', 'Loading your stores…')}</div>
        ) : stores.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">{t('dashboard.no_stores_found', 'No stores found for your seller account.')}</div>
        ) : (
          <div className="p-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="pb-2 pr-4">{t('dashboard.store', 'Store')}</th>
                  <th className="pb-2 pr-4">{t('dashboard.status', 'Status')}</th>
                  <th className="pb-2 pr-4">{t('dashboard.ordering', 'Ordering')}</th>
                  <th className="pb-2 pr-4">{t('dashboard.closed_until', 'Closed Until')}</th>
                  <th className="pb-2 pr-4 text-right">{t('dashboard.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {stores.map(s => {
                  const status = String(s?.status || 'open').toLowerCase()
                  const orderingDisabled = Boolean(s?.orderingDisabled)
                  const closedUntil = s?.closedUntil ? new Date(s.closedUntil) : null
                  return (
                    <tr key={s.id || s._id} className="border-t even:bg-gray-50">
                      <td className="py-2 pr-4 font-medium">{s.name || s.id}</td>
                      <td className="py-2 pr-4 capitalize">{status}</td>
                      <td className="py-2 pr-4">{orderingDisabled ? t('dashboard.disabled', 'Disabled') : t('dashboard.enabled', 'Enabled')}</td>
                      <td className="py-2 pr-4">{closedUntil ? closedUntil.toLocaleString() : '-'}</td>
                      <td className="py-2 pr-4 text-right">
                        <PressScale className="inline-block">
                          <button
                            type="button"
                            className="px-2 py-1 rounded border text-xs hover:bg-gray-50"
                            onClick={async () => {
                              const currentlyClosed = status === 'closed' || orderingDisabled
                              if (currentlyClosed) {
                                // Reopen
                                try {
                                  await sellerService.updateStore(s.id || s._id, { status: 'open', orderingDisabled: false, closedReason: null, closedUntil: null })
                                  announce(`${t('dashboard.reopened', 'Reopened')} ${s.name || t('dashboard.store', 'store')}.`, 'polite')
                                  setStores(prev => prev.map(x => (x.id || x._id) === (s.id || s._id) ? { ...x, status: 'open', orderingDisabled: false, closedReason: null, closedUntil: null } : x))
                                } catch {}
                              } else {
                                const reason = window.prompt(t('dashboard.reason_for_closing', 'Reason for closing? (optional)')) || ''
                                const untilStr = window.prompt(t('dashboard.schedule_reopen', 'Schedule reopen? Enter ISO date-time (or leave blank)')) || ''
                                const payload = { status: 'closed', orderingDisabled: true, closedReason: reason || null, closedUntil: untilStr || null }
                                try {
                                  await sellerService.updateStore(s.id || s._id, payload)
                                  announce(`${t('dashboard.closed', 'Closed')} ${s.name || t('dashboard.store', 'store')}.`, 'polite')
                                  setStores(prev => prev.map(x => (x.id || x._id) === (s.id || s._id) ? { ...x, ...payload } : x))
                                } catch {}
                              }
                            }}
                            aria-label={(String(s?.status || '').toLowerCase() === 'closed' || s?.orderingDisabled) ? t('dashboard.reopen_store', 'Reopen store') : t('dashboard.close_store', 'Close store')}
                          >
                            {(String(s?.status || '').toLowerCase() === 'closed' || s?.orderingDisabled) ? t('dashboard.reopen', 'Reopen') : t('dashboard.close', 'Close')}
                          </button>
                        </PressScale>
                        <PressScale className="inline-block ml-2">
                          <Link
                            to={`/seller/stores/${encodeURIComponent(s.id || s._id)}/edit`}
                            className="px-2 py-1 rounded border text-xs hover:bg-gray-50"
                            aria-label={t('dashboard.edit_store', 'Edit store')}
                          >
                            {t('dashboard.edit', 'Edit')}
                          </Link>
                        </PressScale>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">{t('dashboard.recent_orders', 'Recent Orders')}</h2>
        {orders.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">{t('dashboard.no_recent_orders', 'No recent orders.')}</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t('dashboard.ref', 'Ref')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t('dashboard.date', 'Date')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t('dashboard.total', 'Total')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t('dashboard.status', 'Status')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">{t('dashboard.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.slice(0, 10).map(o => {
                  const date = o.createdAt || o.orderDate || o.date
                  const dt = date ? new Date(date) : null
                  return (
                    <tr key={o.id || o.reference} className="even:bg-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{o.reference || o.id}</td>
                      <td className="px-4 py-2 text-sm">{dt ? dt.toLocaleString() : t('dashboard.unknown', 'Unknown')}</td>
                      <td className="px-4 py-2 text-sm">₹{Number(o.total || o.totals?.payable || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm capitalize">{String(o.status || t('order.pending', 'pending'))}</td>
                      <td className="px-4 py-2 text-right">
                        <PressScale className="inline-block"><Link to={`/seller/orders/${o.id || o.reference}`} className="px-2 py-1 rounded border text-xs hover:bg-gray-50">{t('dashboard.view', 'View')}</Link></PressScale>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageFade>
  )
}
