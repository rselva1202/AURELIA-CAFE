import { useState, useEffect } from 'react'
import {
  getOrders,
  getBookings,
  updateOrderStatus,
  updateBookingStatus,
  loadSampleOrders,
  resetDemoData,
} from '../lib/api'
import { siteConfig } from '../data/siteConfig'

export default function DemoAdminPortal({ onBackToSite }) {
  const [activeTab, setActiveTab] = useState('orders') // 'orders' | 'bookings'
  const [orders, setOrders] = useState([])
  const [bookings, setBookings] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [notice, setNotice] = useState('')

  // Load data from api.js adapter
  const refreshData = async () => {
    const o = await getOrders()
    const b = await getBookings()
    setOrders(o)
    setBookings(b)
  }

  useEffect(() => {
    refreshData()
  }, [])

  const handleUpdateOrder = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus)
    setNotice(`Order ${orderId} updated to ${newStatus}`)
    refreshData()
    setTimeout(() => setNotice(''), 3000)
  }

  const handleUpdateBooking = async (bookingId, newStatus) => {
    await updateBookingStatus(bookingId, newStatus)
    setNotice(`Booking ${bookingId} updated to ${newStatus}`)
    refreshData()
    setTimeout(() => setNotice(''), 3000)
  }

  const handleLoadSample = () => {
    loadSampleOrders()
    refreshData()
    setNotice('Sample orders added to adapter.')
    setTimeout(() => setNotice(''), 3000)
  }

  const handleResetData = () => {
    if (window.confirm('Reset all demo orders and bookings back to seed state?')) {
      resetDemoData()
      refreshData()
      setNotice('Demo data reset to default seed state.')
      setTimeout(() => setNotice(''), 3000)
    }
  }

  // Calculate Today's Totals
  const todayIso = new Date().toISOString().slice(0, 10)
  const todayOrders = orders.filter((o) => (o.createdAt || '').startsWith(todayIso))
  const todayRevenue = todayOrders.reduce(
    (sum, o) => (o.status !== 'cancelled' ? sum + (o.total || 0) : sum),
    0
  )
  const todayBookings = bookings.filter((b) => (b.date || '').startsWith(todayIso) && b.status !== 'cancelled')

  // Filter lists
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (dateFilter && !(o.createdAt || '').startsWith(dateFilter)) return false
    return true
  })

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    if (dateFilter && !(b.date || '').startsWith(dateFilter)) return false
    return true
  })

  return (
    <div className="admin-dashboard-layout">
      {/* Sample Data Banner */}
      <div className="demo-admin-sample-banner">
        <span>🧪 Sample data: all operations run via localStorage in-memory adapter</span>
        <div className="demo-admin-sample-actions">
          <button type="button" onClick={handleLoadSample}>
            + Load sample orders
          </button>
          <button type="button" onClick={handleResetData}>
            ↺ Reset demo data
          </button>
        </div>
      </div>

      {/* Admin Top Header */}
      <header className="admin-header">
        <div className="admin-header-brand">
          <span className="admin-brand-seal">A</span>
          <div>
            <h3>{siteConfig.brand.name} · Demo Admin (/admin-demo)</h3>
            <span className="admin-user-pill">Local Storage Adapter View</span>
          </div>
        </div>

        <div className="admin-header-actions">
          <button type="button" className="button button--light" onClick={onBackToSite}>
            ← Back to Cafe Website
          </button>
        </div>
      </header>

      {notice && (
        <div className="admin-live-notice-bar" role="status">
          ✓ {notice}
        </div>
      )}

      {/* Metrics Row: Today's Totals */}
      <section className="admin-metrics-row">
        <div className="metric-card">
          <span className="metric-card__label">Today's Revenue (Demo)</span>
          <strong className="metric-card__val">₹{todayRevenue}</strong>
          <small>{todayOrders.length} orders placed today</small>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Active Kitchen Queue</span>
          <strong className="metric-card__val">
            {orders.filter((o) => ['paid', 'pay_at_venue', 'preparing'].includes(o.status)).length}
          </strong>
          <small>Orders actively in prep</small>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Today's Bookings</span>
          <strong className="metric-card__val">{todayBookings.length}</strong>
          <small>Reserved tables for today</small>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Total Orders Stored</span>
          <strong className="metric-card__val" style={{ color: 'var(--coral)' }}>
            {orders.length}
          </strong>
          <small>In local adapter storage</small>
        </div>
      </section>

      {/* Tab Controls & Filters */}
      <div className="admin-content-shell">
        <div className="admin-tab-controls">
          <div className="admin-tabs">
            <button
              type="button"
              className={`admin-tab ${activeTab === 'orders' ? 'is-active' : ''}`}
              onClick={() => { setActiveTab('orders'); setStatusFilter('all'); }}
            >
              Orders Queue ({orders.length})
            </button>
            <button
              type="button"
              className={`admin-tab ${activeTab === 'bookings' ? 'is-active' : ''}`}
              onClick={() => { setActiveTab('bookings'); setStatusFilter('all'); }}
            >
              Table Reservations ({bookings.length})
            </button>
          </div>

          <div className="admin-filters">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              {activeTab === 'orders' ? (
                <>
                  <option value="paid">Paid</option>
                  <option value="pay_at_venue">Pay at Table</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </>
              ) : (
                <>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Seated / Completed</option>
                  <option value="no_show">No-Show</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter date"
            />
          </div>
        </div>

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Type / Table</th>
                  <th>Items & Notes</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Change Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-table-empty">
                      No orders found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.orderId}>
                      <td>
                        <strong>{o.orderId}</strong>
                        <br />
                        <small>{new Date(o.createdAt).toLocaleTimeString()}</small>
                      </td>
                      <td>
                        <strong>{o.customer?.name}</strong>
                        <br />
                        <small>{o.customer?.phone}</small>
                      </td>
                      <td>
                        <span className="type-badge">
                          {o.orderType === 'dine-in' ? `🍽 Table ${o.tableNumber || '?'}` : '🛍 Takeaway'}
                        </span>
                      </td>
                      <td>
                        <ul className="admin-item-summary">
                          {(o.items || []).map((it, idx) => (
                            <li key={idx}>
                              {it.name} x {it.quantity} {it.itemNotes && <em>({it.itemNotes})</em>}
                            </li>
                          ))}
                        </ul>
                        {o.notes && <p className="admin-order-note">Note: {o.notes}</p>}
                      </td>
                      <td>
                        <strong className="order-amt">₹{o.total}</strong>
                        <br />
                        <small>{o.paymentMethod === 'demo_online' ? 'Demo Online' : 'Pay at Table'}</small>
                      </td>
                      <td>
                        <span className={`status-pill status-pill--${o.status}`}>
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-action-btn-group">
                          <button
                            type="button"
                            className="act-btn act-btn--prep"
                            onClick={() => handleUpdateOrder(o.orderId, 'preparing')}
                          >
                            🍳 Preparing
                          </button>
                          <button
                            type="button"
                            className="act-btn act-btn--ready"
                            onClick={() => handleUpdateOrder(o.orderId, 'ready')}
                          >
                            🔔 Ready
                          </button>
                          <button
                            type="button"
                            className="act-btn act-btn--done"
                            onClick={() => handleUpdateOrder(o.orderId, 'completed')}
                          >
                            ✓ Complete
                          </button>
                          <button
                            type="button"
                            className="act-btn act-btn--cancel"
                            onClick={() => handleUpdateOrder(o.orderId, 'cancelled')}
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Date & Time</th>
                  <th>Guests & Occasion</th>
                  <th>Status</th>
                  <th>Change Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="admin-table-empty">
                      No table bookings found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.bookingId}>
                      <td>
                        <strong>{b.bookingId}</strong>
                      </td>
                      <td>
                        <strong>{b.customer?.name}</strong>
                        <br />
                        <small>{b.customer?.phone}</small>
                      </td>
                      <td>
                        <strong>{b.date}</strong>
                        <br />
                        <span className="slot-pill">{b.timeSlot} hrs</span>
                      </td>
                      <td>
                        <span>{b.people} guests</span>
                        <br />
                        <small>{b.occasion}</small>
                        {b.notes && <p className="admin-order-note">Note: {b.notes}</p>}
                      </td>
                      <td>
                        <span className={`status-pill status-pill--${b.status}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-action-btn-group">
                          <button
                            type="button"
                            className="act-btn act-btn--done"
                            onClick={() => handleUpdateBooking(b.bookingId, 'confirmed')}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="act-btn act-btn--prep"
                            onClick={() => handleUpdateBooking(b.bookingId, 'completed')}
                          >
                            Seated
                          </button>
                          <button
                            type="button"
                            className="act-btn act-btn--noshow"
                            onClick={() => handleUpdateBooking(b.bookingId, 'no_show')}
                          >
                            No-Show
                          </button>
                          <button
                            type="button"
                            className="act-btn act-btn--cancel"
                            onClick={() => handleUpdateBooking(b.bookingId, 'cancelled')}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
