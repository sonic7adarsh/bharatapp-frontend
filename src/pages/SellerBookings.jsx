import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import sellerService from "../services/sellerService";
import DateRangePicker from "../components/DateRangePicker";

export default function SellerBookings() {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState(urlParams.get('status') || "");
  const [fromDate, setFromDate] = useState(urlParams.get('from') || "");
  const [toDate, setToDate] = useState(urlParams.get('to') || "");
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState(urlParams.get('storeId') || "");
  const [page, setPage] = useState(Number(urlParams.get('page')) || 1);
  const [limit, setLimit] = useState(Number(urlParams.get('limit')) || 20);
  const [pageInput, setPageInput] = useState(Number(urlParams.get('page')) || 1);

  // Derived query params
  const queryParams = useMemo(() => {
    const params = { page, limit };
    if (statusFilter) params.status = statusFilter;
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    if (storeId) params.storeId = storeId;
    return params;
  }, [statusFilter, fromDate, toDate, storeId, page, limit]);

  // Sync URL query params with current filters/pager
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (statusFilter) params.set('status', statusFilter);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    if (storeId) params.set('storeId', storeId);
    navigate({ search: params.toString() }, { replace: true });
  }, [page, limit, statusFilter, fromDate, toDate, storeId, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function fetchBookings() {
      setLoading(true);
      setError(null);
      try {
        const data = await sellerService.getBookings(queryParams);
        if (!cancelled) {
          if (Array.isArray(data)) {
            setBookings(data);
            setTotal(null);
          } else if (data && Array.isArray(data.items)) {
            setBookings(data.items);
            const t = (typeof data.total === 'number' ? data.total : (typeof data.count === 'number' ? data.count : (data.pagination?.total ?? null)));
            setTotal(typeof t === 'number' ? t : null);
          } else {
            setBookings([]);
            setTotal(null);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load bookings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchBookings();
    return () => {
      cancelled = true;
    };
  }, [queryParams]);

  // Load seller stores for store filter
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await sellerService.getSellerStores();
        if (!cancelled) setStores(data || []);
      } catch {}
    })();
    return () => { cancelled = true };
  }, []);

  async function updateStatus(bookingId, nextStatus) {
    try {
      await sellerService.updateBookingStatus(bookingId, { status: nextStatus });
      // Optimistically update UI
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: nextStatus } : b))
      );
    } catch (err) {
      // errors are globally toasted by axios interceptors
      console.error("Failed to update booking status", err);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Seller Bookings</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              // Export current bookings view to CSV
              const rows = bookings.map((b) => {
                const ref = b.reference || b.id;
                const guest = b.customerName || b.buyer?.name || b.customer?.name || "";
                const phone = b.buyer?.phone || b.customer?.phone || b.guest?.phone || "";
                const status = b.status || "";
                const amount = typeof b.total === "number" ? b.total : (b.amount || "");
                const date = b.createdAt || "";
                const store = b.store?.id || b.storeId || "";
                return [b.id, ref, status, amount, date, store, guest, phone];
              });
              const header = ["id","reference","status","amount","createdAt","storeId","guest","phone"];
              function escapeCsv(val) {
                const s = String(val ?? "");
                const escaped = s.replace(/"/g, '""');
                return `"${escaped}"`;
              }
              const csv = [header, ...rows].map(row => row.map(escapeCsv).join(",")).join("\n");
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              const today = new Date().toISOString().slice(0,10);
              const storeLabel = (stores.find(s => String(s.id) === String(storeId))?.name || 'all-stores').replace(/[^a-zA-Z0-9_-]/g,'_');
              const statusLabel = (statusFilter || 'all-status');
              const fromLabel = (fromDate || 'all-from');
              const toLabel = (toDate || 'all-to');
              a.download = `bookings_${storeLabel}_${statusLabel}_${fromLabel}_${toLabel}_${today}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
          >
            Export CSV
          </button>
          <Link
            to="/dashboard"
            className="text-blue-600 hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Store</label>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">All</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name || s.id}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <DateRangePicker
          from={fromDate}
          to={toDate}
          onChange={({ from, to }) => { setFromDate(from || ""); setToDate(to || ""); }}
        />
        <div>
          <label className="block text-sm text-gray-600 mb-1">Per Page</label>
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); setPageInput(1); }}
            className="w-full border rounded px-3 py-2"
          >
            {[10,20,50,100].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p>Loading bookings...</p>}
      {error && (
        <p className="text-red-600">{typeof error === "string" ? error : "Error"}</p>
      )}

      {!loading && bookings.length === 0 && (
        <div className="text-gray-600">No bookings found for the selected filters.</div>
      )}

      {!loading && bookings.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 border-b">Reference</th>
                <th className="text-left px-4 py-2 border-b">Guest</th>
                <th className="text-left px-4 py-2 border-b">Status</th>
                <th className="text-left px-4 py-2 border-b">Amount</th>
                <th className="text-left px-4 py-2 border-b">Date</th>
                <th className="text-left px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const ref = b.reference || b.id;
                const guest = b.customerName || b.buyer?.name || "-";
                const status = b.status || "-";
                const amount = typeof b.total === "number" ? b.total : b.amount;
                const date = b.createdAt
                  ? new Date(b.createdAt).toLocaleString()
                  : "-";
                return (
                  <tr key={b.id} className="border-t">
                    <td className="px-4 py-2">
                      <Link to={`/seller/bookings/${b.id}`} className="font-medium text-blue-600 hover:underline">{ref}</Link>
                    </td>
                    <td className="px-4 py-2">{guest}</td>
                    <td className="px-4 py-2">
                      <span className="inline-block px-2 py-1 rounded bg-gray-100">
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{amount ? `₹${amount}` : "-"}</td>
                    <td className="px-4 py-2">{date}</td>
                    <td className="px-4 py-2 space-x-2">
                      <button
                        className="px-3 py-1 text-sm rounded bg-blue-600 text-white"
                        onClick={() => updateStatus(b.id, "confirmed")}
                      >
                        Confirm
                      </button>
                      <button
                        className="px-3 py-1 text-sm rounded bg-green-600 text-white"
                        onClick={() => updateStatus(b.id, "checked_in")}
                      >
                        Check In
                      </button>
                      <button
                        className="px-3 py-1 text-sm rounded bg-emerald-700 text-white"
                        onClick={() => updateStatus(b.id, "checked_out")}
                      >
                        Check Out
                      </button>
                      <button
                        className="px-3 py-1 text-sm rounded bg-red-600 text-white"
                        onClick={() => updateStatus(b.id, "cancelled")}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">Showing {bookings.length} result(s){typeof total === 'number' ? ` of ${total}` : ''}</div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 rounded border border-gray-300 disabled:opacity-50"
                onClick={() => { const np = Math.max(1, page - 1); setPage(np); setPageInput(np); }}
                disabled={page === 1}
              >
                Prev
              </button>
              <div className="text-sm">Page {page}{typeof total === 'number' ? ` of ${Math.max(1, Math.ceil(total / limit))}` : ''}</div>
              <input
                type="number"
                min={1}
                className="w-20 px-2 py-1 border rounded"
                value={pageInput}
                onChange={(e) => setPageInput(Number(e.target.value) || 1)}
                onKeyDown={(e) => { if (e.key === 'Enter') { const val = Math.max(1, Number(pageInput) || 1); setPage(val); } }}
                aria-label="Go to page"
              />
              <button
                className="px-3 py-1.5 rounded border border-gray-300"
                onClick={() => setPage(Math.max(1, Number(pageInput) || 1))}
              >
                Go
              </button>
              <button
                className="px-3 py-1.5 rounded border border-gray-300 disabled:opacity-50"
                onClick={() => { const np = page + 1; setPage(np); setPageInput(np); }}
                disabled={typeof total === 'number' ? page >= Math.max(1, Math.ceil(total / limit)) : bookings.length < limit}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}