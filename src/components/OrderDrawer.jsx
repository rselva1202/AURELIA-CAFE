import { useState, useEffect, useRef } from 'react'
import { siteConfig } from '../data/siteConfig'
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
  const [consentGiven, setConsentGiven] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Honeypot field ref
  const honeypotRef = useRef('')

  // Update table number from prop if changed
  useEffect(() => {
    if (defaultTable) {
      setTableNumber(defaultTable)
      setOrderType('dine-in')
    }
  }, [defaultTable])

  // Total calculation: only numeric priced items
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

  // Validation
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
    if (!consentGiven) {
      setErrorMessage('Please agree to the privacy policy & order terms.')
      return false
    }
    if (isAlcoholExcluded) {
      setErrorMessage('Alcoholic beverages cannot be ordered online as per local regulations.')
      return false
    }
    setErrorMessage('')
    return true
  }

  // Handle Pay Online (Razorpay)
  const handlePayOnline = async () => {
    if (!validateForm() || submitting) return
    setSubmitting(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customer: { name: customerName, phone: customerPhone },
          orderType,
          tableNumber: orderType === 'dine-in' ? tableNumber : null,
          notes: generalNotes,
          paymentMethod: 'razorpay',
          hp_field: honeypotRef.current?.value || '',
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate order')
      }

      const { order, razorpayOrderId, keyId } = data

      // Check if Razorpay script is available
      if (typeof window.Razorpay === 'function') {
        const options = {
          key: keyId,
          amount: order.total * 100,
          currency: 'INR',
          name: siteConfig.brand.name,
          description: `Order #${order.orderId}`,
          order_id: razorpayOrderId.startsWith('order_demo_') ? undefined : razorpayOrderId,
          handler: async (paymentResp) => {
            try {
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: order.orderId,
                  razorpayPaymentId: paymentResp.razorpay_payment_id,
                  razorpayOrderId: paymentResp.razorpay_order_id,
                  razorpaySignature: paymentResp.razorpay_signature,
                }),
              })
              const verifyData = await verifyRes.json()
              onClear()
              onClose()
              onOrderSuccess(order.orderId, 'paid')
            } catch (vErr) {
              setErrorMessage('Payment verification error. Please contact staff.')
            }
          },
          prefill: {
            name: customerName,
            contact: customerPhone,
          },
          theme: {
            color: siteConfig.theme.espressoBrown || '#2B1B14',
          },
          modal: {
            ondismiss: () => {
              setSubmitting(false)
              setErrorMessage('Payment was cancelled before completion.')
            },
          },
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        // Fallback demo simulation if Razorpay SDK script isn't loaded
        setTimeout(() => {
          onClear()
          onClose()
          onOrderSuccess(order.orderId, 'paid')
        }, 800)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error creating order.')
      setSubmitting(false)
    }
  }

  // Handle Pay at Table / On Pickup
  const handlePayAtVenue = async () => {
    if (!validateForm() || submitting) return
    setSubmitting(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customer: { name: customerName, phone: customerPhone },
          orderType,
          tableNumber: orderType === 'dine-in' ? tableNumber : null,
          notes: generalNotes,
          paymentMethod: 'pay_at_venue',
          hp_field: honeypotRef.current?.value || '',
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit order')
      }

      onClear()
      onClose()
      onOrderSuccess(data.order.orderId, 'pay_at_venue')
    } catch (err) {
      setErrorMessage(err.message || 'Error submitting order.')
      setSubmitting(false)
    }
  }

  // Fallback: Send Order on WhatsApp
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
    <div className="order-drawer-portal" role="dialog" aria-modal="true" aria-label="Order Cart Drawer">
      <div className="order-drawer__backdrop" onClick={onClose} />
      <aside className="order-drawer">
        <div className="order-drawer__header">
          <div>
            <h3>Your Order</h3>
            <p className="order-drawer__sub">
              {siteConfig.brand.name} · {orderType === 'dine-in' && tableNumber ? `Table #${tableNumber}` : 'Online Cart'}
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
              <p>Your order drawer is empty.</p>
              <small>Tap "+" on menu items to add to your cart.</small>
            </div>
          ) : (
            <>
              {/* Order Type Toggle & Table Number */}
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

              {/* Items List with Quantity Controls and Item Notes */}
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

                    {/* Per-item note input */}
                    <div className="order-drawer__item-note-input">
                      <input
                        type="text"
                        placeholder="Special request (e.g., extra hot, less butter)..."
                        value={item.itemNotes || ''}
                        onChange={(e) => onUpdateItemNotes(item.id, e.target.value)}
                        maxLength={120}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              {/* Customer Contact Information */}
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

                {/* Honeypot field (hidden from users, traps bots) */}
                <input
                  type="text"
                  name="website"
                  ref={honeypotRef}
                  style={{ display: 'none', position: 'absolute', opacity: 0 }}
                  tabIndex="-1"
                  autoComplete="off"
                />

                <label className="general-note-label">
                  <span>Order Notes / Instructions</span>
                  <textarea
                    rows="2"
                    placeholder="Allergies, packaging preference, or instructions..."
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                  />
                </label>

                {/* Consent Checkbox with Privacy Policy Link */}
                <label className="consent-checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                  />
                  <span>
                    I agree to the <a href="#privacy" target="_blank">Privacy Notice</a> & <a href="#terms" target="_blank">Terms</a>. (No card or UPI data is stored on server).
                  </span>
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
                  <small className="unpriced-note">Items marked "Ask us" must be confirmed with staff</small>
                )}
              </div>
            </div>

            {/* Payment Action Buttons */}
            <div className="drawer-actions-grid">
              <button
                type="button"
                className="button button--primary pay-online-btn"
                onClick={handlePayOnline}
                disabled={submitting || isAlcoholExcluded}
              >
                <span>{submitting ? 'Processing...' : 'Pay Online (Cards/UPI/Wallets)'}</span>
                <ArrowIcon />
              </button>

              {siteConfig.payments?.allowPayAtVenue && (
                <button
                  type="button"
                  className="button button--outline pay-venue-btn"
                  onClick={handlePayAtVenue}
                  disabled={submitting}
                >
                  <span>Pay at the Table / on Pickup</span>
                </button>
              )}

              <button
                type="button"
                className="button-link whatsapp-fallback-link"
                onClick={handleSendWhatsApp}
              >
                Send order on WhatsApp (Fallback) ↗
              </button>
            </div>

            <button type="button" className="order-drawer__clear-btn" onClick={onClear}>
              Clear Cart
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
