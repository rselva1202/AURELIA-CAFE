import { useState, useEffect, useRef } from 'react'
import { siteConfig } from '../data/siteConfig'
import { createOrder } from '../lib/api'
import DemoCheckoutModal from './DemoCheckoutModal'
import { ArrowIcon } from './UI'

export default function OrderDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onUpdateItemNotes,
  onClear,
  onOrderSuccess,
  defaultTable = null,
}) {
  const [orderType, setOrderType] = useState('dine-in')
  const [tableNumber, setTableNumber] = useState(defaultTable || '')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [generalNotes, setGeneralNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)

  useEffect(() => {
    if (defaultTable) {
      setTableNumber(defaultTable)
      setOrderType('dine-in')
    }
  }, [defaultTable])

  const total = items.reduce((sum, item) => {
    if (typeof item.price === 'number') {
      return sum + item.price * item.quantity
    }
    return sum
  }, 0)

  const hasUnpriced = items.some((item) => typeof item.price !== 'number')
  const isAlcoholExcluded = items.some(
    (item) => item.category === 'alcohol' || item.alcoholOnly
  )

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    if (isOpen) {
      document.body.classList.add('order-drawer-open')
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.classList.remove('order-drawer-open')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const validateForm = () => {
    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage('Please enter your full name (at least 2 letters).')
      return false
    }
    const cleanPhone = customerPhone.replace(/[^0-9+]/g, '')
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.')
      return false
    }
    if (orderType === 'dine-in' && !tableNumber) {
      setErrorMessage('Please enter your table number for dine-in.')
      return false
    }
    if (isAlcoholExcluded) {
      setErrorMessage('Alcoholic beverages cannot be ordered online as per local regulations.')
      return false
    }
    setErrorMessage('')
    return true
  }

  // Handle Pay Online (Demo) -> Opens DemoCheckoutModal
  const handleOpenDemoCheckout = () => {
    if (!validateForm()) return
    setShowCheckoutModal(true)
  }

  // Demo Checkout Authorization Success
  const handleCheckoutSuccess = async () => {
    setShowCheckoutModal(false)
    setSubmitting(true)
    try {
      const res = await createOrder({
        items,
        customer: { name: customerName, phone: customerPhone },
        orderType,
        tableNumber: orderType === 'dine-in' ? tableNumber : null,
        notes: generalNotes,
        paymentMethod: 'demo_online',
      })

      onClear()
      onClose()
      onOrderSuccess(res.order)
    } catch (err) {
      setErrorMessage(err.message || 'Error creating demo order.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Pay at the Table
  const handlePayAtVenue = async () => {
    if (!validateForm() || submitting) return
    setSubmitting(true)
    setErrorMessage('')

    try {
      const res = await createOrder({
        items,
        customer: { name: customerName, phone: customerPhone },
        orderType,
        tableNumber: orderType === 'dine-in' ? tableNumber : null,
        notes: generalNotes,
        paymentMethod: 'pay_at_venue',
      })

      onClear()
      onClose()
      onOrderSuccess(res.order)
    } catch (err) {
      setErrorMessage(err.message || 'Error submitting order.')
    } finally {
      setSubmitting(false)
    }
  }

  // WhatsApp Order Fallback
  const handleSendWhatsApp = () => {
    const lines = [
      `Order Enquiry · ${siteConfig.brand.name}`,
      `Order Type: ${orderType.toUpperCase()}${orderType === 'dine-in' && tableNumber ? ` (Table ${tableNumber})` : ''}`,
      `Customer: ${customerName || 'Guest'} (${customerPhone || 'Phone unprovided'})`,
      `---------------------------------`,
      ...items.map((it) => {
        const priceStr = typeof it.price === 'number' ? `₹${it.price * it.quantity}` : '(price to confirm)'
        const noteStr = it.itemNotes ? ` [Note: ${it.itemNotes}]` : ''
        return `• ${it.name} x ${it.quantity} — ${priceStr}${noteStr}`
      }),
      `---------------------------------`,
      `Total: ₹${total}${hasUnpriced ? ' (+ items to confirm)' : ''}`,
    ]

    if (generalNotes.trim()) {
      lines.push(`Notes: ${generalNotes.trim()}`)
    }

    const message = lines.join('\n')
    const url = `https://wa.me/${siteConfig.brand.whatsapp}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  if (!isOpen) return null

  return (
    <>
      <div className="order-drawer-portal" role="dialog" aria-modal="true" aria-label="Cart Drawer">
        <div className="order-drawer__backdrop" onClick={onClose} />
        <aside className="order-drawer">
          <div className="order-drawer__header">
            <div>
              <h3>Your Order</h3>
              <p className="order-drawer__sub">
                {siteConfig.brand.name} · {orderType === 'dine-in' && tableNumber ? `Table #${tableNumber}` : 'Cart Drawer'}
              </p>
            </div>
            <button
              type="button"
              className="order-drawer__close"
              onClick={onClose}
              aria-label="Close cart"
            >
              ✕
            </button>
          </div>

          <div className="order-drawer__body">
            {items.length === 0 ? (
              <div className="order-drawer__empty">
                <span className="order-drawer__empty-icon" aria-hidden="true">☕</span>
                <p>Your cart is empty.</p>
                <small>Tap "+" on menu items to add to your order.</small>
              </div>
            ) : (
              <>
                {/* Dining Option: Dine-In vs Takeaway */}
                <div className="drawer-order-type">
                  <label className="type-toggle-label">Dining Option:</label>
                  <div className="type-pill-group">
                    <button
                      type="button"
                      className={`type-pill ${orderType === 'dine-in' ? 'is-active' : ''}`}
                      onClick={() => setOrderType('dine-in')}
                    >
                      🍽 Dine-In
                    </button>
                    <button
                      type="button"
                      className={`type-pill ${orderType === 'takeaway' ? 'is-active' : ''}`}
                      onClick={() => setOrderType('takeaway')}
                    >
                      🛍 Takeaway
                    </button>
                  </div>

                  {orderType === 'dine-in' && (
                    <div className="table-input-field">
                      <label htmlFor="drawer-table-no">Table Number *</label>
                      <input
                        id="drawer-table-no"
                        type="text"
                        placeholder="e.g. 5"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Items List */}
                <ul className="order-drawer__list">
                  {items.map((item) => (
                    <li className="order-drawer__item" key={item.id}>
                      <div className="order-drawer__item-main">
                        <div className="order-drawer__item-info">
                          <strong className="order-drawer__item-name">{item.name}</strong>
                          <span className="order-drawer__item-price">
                            {typeof item.price === 'number' ? `₹${item.price} each` : <em className="price-to-confirm">Ask us</em>}
                          </span>
                        </div>

                        <div className="order-drawer__item-actions">
                          <div className="qty-controls">
                            <button
                              type="button"
                              aria-label={`Decrease ${item.name} quantity`}
                              onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                            >
                              −
                            </button>
                            <span className="qty-value">{item.quantity}</span>
                            <button
                              type="button"
                              aria-label={`Increase ${item.name} quantity`}
                              onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                            >
                              +
                            </button>
                          </div>

                          <span className="order-drawer__item-subtotal">
                            {typeof item.price === 'number' ? `₹${item.price * item.quantity}` : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Item note input */}
                      <div className="order-drawer__item-note-input">
                        <input
                          type="text"
                          placeholder="Special request (e.g. extra crispy, less sugar)..."
                          value={item.itemNotes || ''}
                          onChange={(e) => onUpdateItemNotes(item.id, e.target.value)}
                          maxLength={120}
                        />
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Customer Details Form */}
                <div className="drawer-customer-form">
                  <h4>Customer Details</h4>
                  <div className="form-row-compact">
                    <label>
                      <span>Full Name *</span>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      <span>Phone Number *</span>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                      />
                    </label>
                  </div>

                  <label className="general-note-label">
                    <span>Order Notes / Delivery Notes</span>
                    <textarea
                      rows="2"
                      placeholder="Special instructions or dietary notes..."
                      value={generalNotes}
                      onChange={(e) => setGeneralNotes(e.target.value)}
                    />
                  </label>
                </div>
              </>
            )}

            {errorMessage && (
              <div className="drawer-error-alert" role="alert">
                ⚠️ {errorMessage}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="order-drawer__footer">
              <div className="order-drawer__total-row">
                <span>Total:</span>
                <div className="total-display">
                  <strong>₹{total}</strong>
                  {hasUnpriced && (
                    <small className="unpriced-note">Items without price confirmed on arrival</small>
                  )}
                </div>
              </div>

              {/* Payment Actions */}
              <div className="drawer-actions-grid">
                <button
                  type="button"
                  className="button button--primary pay-online-btn"
                  onClick={handleOpenDemoCheckout}
                  disabled={submitting || isAlcoholExcluded}
                >
                  <span>Pay Online (Demo)</span>
                  <ArrowIcon />
                </button>

                <button
                  type="button"
                  className="button button--outline pay-venue-btn"
                  onClick={handlePayAtVenue}
                  disabled={submitting}
                >
                  <span>Pay at the Table</span>
                </button>

                <button
                  type="button"
                  className="button-link whatsapp-fallback-link"
                  onClick={handleSendWhatsApp}
                >
                  Send order on WhatsApp (Alternative) ↗
                </button>
              </div>

              <button type="button" className="order-drawer__clear-btn" onClick={onClear}>
                Clear Cart
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Demo Checkout Modal with UPI/Card Tabs & 2s Processing */}
      <DemoCheckoutModal
        isOpen={showCheckoutModal}
        total={total}
        customerName={customerName}
        onClose={() => setShowCheckoutModal(false)}
        onSuccess={handleCheckoutSuccess}
        onSimulateFailure={() => {}}
      />
    </>
  )
}
