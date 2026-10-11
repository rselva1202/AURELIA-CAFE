import { useState, useEffect, useRef } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { siteConfig } from '../data/siteConfig'
import { ArrowIcon } from './UI'

export default function AdminPortal({ onBackToSite }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Dashboard Tabs: 'orders' | 'bookings'
  const [activeTab, setActiveTab] = useState('orders')

  // Data lists
  const [orders, setOrders] = useState([])
  const [bookings, setBookings] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [audioEnabled, setAudioEnabled] = useState(true)

  // Sound alert ref for new orders
  const audioContextRef = useRef(null)
  const prevOrdersCountRef = useRef(0)

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  // Web Audio chime for new incoming orders
  const playNewOrderChime = () => {
    if (!audioEnabled) return
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = ctx
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.35)
    } catch {
      // Audio autoplay may require prior gesture
    }
  }

  // Real-time Firestore onSnapshot for Orders
  useEffect(() => {
    if (!user) return undefined
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const list = []
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() })
          })

          // Detect new order arrival and trigger sound
          if (list.length > prevOrdersCountRef.current && prevOrdersCountRef.current > 0) {
            playNewOrderChime()
          }
          prevOrdersCountRef.current = list.length
          setOrders(list)
        },
        (error) => {
          console.warn('[Admin] Firestore onSnapshot notice (Demo mock):', error.message)
          // Populate sample demo orders for admin demo preview
          if (orders.length === 0) {
            setOrders(getSampleDemoOrders())
          }
        }
      )
      return () => unsub()
    } catch (e) {
      if (orders.length === 0) setOrders(getSampleDemoOrders())
    }
  }, [user, audioEnabled])

  // Real-time Firestore onSnapshot for Bookings
  useEffect(() => {
    if (!user) return undefined
    try {
      const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const list = []
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() })
          })
          setBookings(list)
        },
        (error) => {
          console.warn('[Admin] Bookings onSnapshot notice (Demo mock):', error.message)
          if (bookings.length === 0) {
            setBookings(getSampleDemoBookings())
          }
        }
      )
      return () => unsub()
    } catch {
      if (bookings.length === 0) setBookings(getSampleDemoBookings())
    }
  }, [user])

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      // If demo mode and Firebase Auth is unconfigured, allow quick Owner Demo login
      if (email.includes('@') && password.length >= 6) {
        setUser({ email, uid: 'demo_owner_123' })
      } else {
        setLoginError('Invalid credentials. (Hint for demo: owner@aureliacafe.com / password123)')
      }
    }
  }

  // Update order status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId)
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      })
    } catch {
      // Local state update fallback
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId || o.id === orderId ? { ...o, status: newStatus } : o))
      )
    }
  }

  // Update booking status
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const bkgRef = doc(db, 'bookings', bookingId)
      await updateDoc(bkgRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      })
    } catch {
      setBookings((prev) =>
        prev.map((b) => (b.bookingId === bookingId || b.id === bookingId ? { ...b, status: newStatus } : b))
      )
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === 'orders') {
      const headers = ['Order ID,Customer,Phone,Order Type,Table,Total,Status,Created At\n']
      const rows = orders.map((o) =>
        `"${o.orderId || o.id}","${o.customer?.name || ''}","${o.customer?.phone || ''}","${o.orderType || ''}","${o.tableNumber || ''}","₹${o.total || 0}","${o.status || ''}","${o.createdAt || ''}"`
      )
      downloadCSV(headers.concat(rows).join('\n'), `aurelia_orders_${Date.now()}.csv`)
    } else {
      const headers = ['Booking ID,Customer,Phone,Date,Time Slot,Guests,Occasion,Status,Created At\n']
      const rows = bookings.map((b) =>
        `"${b.bookingId || b.id}","${b.customer?.name || ''}","${b.customer?.phone || ''}","${b.date || ''}","${b.timeSlot || ''}","${b.people || 1}","${b.occasion || ''}","${b.status || ''}","${b.createdAt || ''}"`
      )
      downloadCSV(headers.concat(rows).join('\n'), `aurelia_bookings_${Date.now()}.csv`)
    }
  }

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // Calculate Today's Totals
  const todayIso = new Date().toISOString().slice(0, 10)
  const todayOrders = orders.filter((o) => (o.createdAt || '').startsWith(todayIso))
  const todayRevenue = todayOrders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + (o.total || 0) : sum), 0)
  const todayBookings = bookings.filter((b) => (b.date || '').startsWith(todayIso) && b.status !== 'cancelled')

  // Filtered lists
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

  // 1. Authentication Loading state
  if (authLoading) {
    return (
      <div className="admin-loading-screen">
        <p>Loading Aurelia Cafe Admin...</p>
      </div>
    )
  }

  // 2. Login Screen
  if (!user) {
    return (
      <div className="admin-login-layout">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <span className="admin-brand-seal">A</span>
            <h2>{siteConfig.brand.name}</h2>
            <p className="admin-subtitle">Owner & Staff Admin Portal</p>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            <label>
              <span>Owner Email</span>
              <input
                type="email"
                placeholder="owner@aureliacafe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {loginError && <p className="admin-error-text">{loginError}</p>}

            <button type="submit" className="button button--primary admin-submit-btn">
              <span>Sign In to Dashboard</span>
              <ArrowIcon />
            </button>
          </form>

          <button type="button" className="admin-back-link" onClick={onBackToSite}>
            ← Back to Cafe Website
          </button>
        </div>
      </div>
    )
  }

  // 3. Authenticated Dashboard Screen
  return (
    <div className="admin-dashboard-layout">
      {/* Top Bar */}
      <header className="admin-header">
        <div className="admin-header-brand">
          <span className="admin-brand-seal">A</span>
          <div>
            <h3>{siteConfig.brand.name} · Admin</h3>
            <span className="admin-user-pill">{user.email} (Owner)</span>
          </div>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className={`admin-audio-toggle ${audioEnabled ? 'is-active' : ''}`}
            onClick={() => setAudioEnabled(!audioEnabled)}
            title="Toggle sound alert for incoming orders"
          >
            {audioEnabled ? '🔔 Sound On' : '🔕 Sound Off'}
          </button>
          <button type="button" className="button button--light" onClick={onBackToSite}>
            View Website
          </button>
          <button type="button" className="button button--outline" onClick={() => signOut(auth)}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Metrics Row: Today's Totals */}
      <section className="admin-metrics-row">
        <div className="metric-card">
          <span className="metric-card__label">Today's Revenue</span>
          <strong className="metric-card__val">₹{todayRevenue}</strong>
          <small>{todayOrders.length} orders placed today</small>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Active Orders</span>
          <strong className="metric-card__val">
            {orders.filter((o) => ['pending_payment', 'paid', 'preparing'].includes(o.status)).length}
          </strong>
          <small>In kitchen & awaiting pickup</small>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Today's Bookings</span>
          <strong className="metric-card__val">{todayBookings.length}</strong>
          <small>Total reserved tables for today</small>
        </div>
        <div className="metric-card">
          <span className="metric-card__label">Mode</span>
          <strong className="metric-card__val" style={{ color: 'var(--coral)' }}>
            {siteConfig.payments?.mode.toUpperCase()}
          </strong>
          <small>Razorpay test mode simulated</small>
        </div>
      </section>

      {/* Dashboard Tabs & Controls */}
      <div className="admin-content-shell">
        <div className="admin-tab-controls">
          <div className="admin-tabs">
            <button
              type="button"
              className={`admin-tab ${activeTab === 'orders' ? 'is-active' : ''}`}
              onClick={() => { setActiveTab('orders'); setStatusFilter('all'); }}
            >
              Live Orders ({orders.length})
            </button>
            <button
              type="button"
              className={`admin-tab ${activeTab === 'bookings' ? 'is-active' : ''}`}
              onClick={() => { setActiveTab('bookings'); setStatusFilter('all'); }}
            >
              Table Bookings ({bookings.length})
            </button>
          </div>

          <div className="admin-filters">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              {activeTab === 'orders' ? (
                <>
                  <option value="paid">Paid</option>
                  <option value="pay_at_venue">Pay at Venue</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </>
              ) : (
                <>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
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

            <button type="button" className="admin-csv-btn" onClick={handleExportCSV}>
              📥 Export CSV
            </button>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-table-empty">
                      No orders found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.orderId || o.id}>
                      <td>
                        <strong>{o.orderId || o.id}</strong>
                        <br />
                        <small>{new Date(o.createdAt || Date.now()).toLocaleTimeString()}</small>
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
                        <small>{o.paymentMethod}</small>
                      </td>
                      <td>
                        <span className={`status-pill status-pill--${o.status}`}>
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-action-btn-group">
                          {o.status === 'paid' && (
                            <button
                              type="button"
                              className="act-btn act-btn--prep"
                              onClick={() => handleUpdateOrderStatus(o.orderId || o.id, 'preparing')}
                            >
                              🍳 Preparing
                            </button>
                          )}
                          {o.status === 'preparing' && (
                            <button
                              type="button"
                              className="act-btn act-btn--ready"
                              onClick={() => handleUpdateOrderStatus(o.orderId || o.id, 'ready')}
                            >
                              🔔 Ready
                            </button>
                          )}
                          {o.status === 'ready' && (
                            <button
                              type="button"
                              className="act-btn act-btn--done"
                              onClick={() => handleUpdateOrderStatus(o.orderId || o.id, 'completed')}
                            >
                              ✓ Complete
                            </button>
                          )}
                          {o.status !== 'completed' && o.status !== 'cancelled' && (
                            <button
                              type="button"
                              className="act-btn act-btn--cancel"
                              onClick={() => handleUpdateOrderStatus(o.orderId || o.id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          )}
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
                  <th>Deposit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-table-empty">
                      No table bookings found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.bookingId || b.id}>
                      <td>
                        <strong>{b.bookingId || b.id}</strong>
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
                        {b.depositAmount > 0 ? `₹${b.depositAmount}` : 'No deposit'}
                      </td>
                      <td>
                        <span className={`status-pill status-pill--${b.status}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-action-btn-group">
                          {b.status === 'pending' && (
                            <button
                              type="button"
                              className="act-btn act-btn--done"
                              onClick={() => handleUpdateBookingStatus(b.bookingId || b.id, 'confirmed')}
                            >
                              Confirm
                            </button>
                          )}
                          {b.status === 'confirmed' && (
                            <>
                              <button
                                type="button"
                                className="act-btn act-btn--done"
                                onClick={() => handleUpdateBookingStatus(b.bookingId || b.id, 'completed')}
                              >
                                Seated
                              </button>
                              <button
                                type="button"
                                className="act-btn act-btn--noshow"
                                onClick={() => handleUpdateBookingStatus(b.bookingId || b.id, 'no_show')}
                              >
                                No-Show
                              </button>
                            </>
                          )}
                          {b.status !== 'cancelled' && b.status !== 'completed' && (
                            <button
                              type="button"
                              className="act-btn act-btn--cancel"
                              onClick={() => handleUpdateBookingStatus(b.bookingId || b.id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          )}
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

// Sample fallback mock data for testing when Firebase credentials are not connected yet
function getSampleDemoOrders() {
  return [
    {
      orderId: 'ORD-DEMO-1001',
      customer: { name: 'Kavitha R', phone: '+91 98401 23456' },
      orderType: 'dine-in',
      tableNumber: '4',
      items: [
        { name: 'Cheese Toast', quantity: 2, subtotal: 280, itemNotes: 'Crispy' },
        { name: 'Espresso', quantity: 2, subtotal: 0, itemNotes: '' },
      ],
      total: 280,
      paymentMethod: 'razorpay',
      status: 'paid',
      createdAt: new Date().toISOString(),
    },
    {
      orderId: 'ORD-DEMO-1002',
      customer: { name: 'Vikram Menon', phone: '+91 94470 12345' },
      orderType: 'takeaway',
      tableNumber: null,
      items: [
        { name: 'French Toast', quantity: 1, subtotal: 140, itemNotes: 'Extra maple' },
        { name: 'Mixed Fruit Muesli, Curd & Honey', quantity: 1, subtotal: 200 },
      ],
      total: 340,
      paymentMethod: 'pay_at_venue',
      status: 'preparing',
      createdAt: new Date().toISOString(),
    },
  ]
}

function getSampleDemoBookings() {
  return [
    {
      bookingId: 'BKG-DEMO-2001',
      customer: { name: 'Arjun Das', phone: '+91 99955 88776' },
      date: new Date().toISOString().slice(0, 10),
      timeSlot: '17:30',
      people: 2,
      occasion: 'Sunset & Golden hour',
      notes: 'Cliff-edge table please',
      depositAmount: 0,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    },
    {
      bookingId: 'BKG-DEMO-2002',
      customer: { name: 'Sophie Miller', phone: '+44 7700 900123' },
      date: new Date().toISOString().slice(0, 10),
      timeSlot: '19:00',
      people: 4,
      occasion: 'Live music evening',
      notes: '',
      depositAmount: 0,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    },
  ]
}
