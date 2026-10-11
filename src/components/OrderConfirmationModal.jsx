import { useEffect, useState } from 'react'
import { siteConfig } from '../data/siteConfig'
import { ArrowIcon } from './UI'

export default function OrderConfirmationModal({ orderId, initialStatus = 'paid', onClose }) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)

  // Polling simulation for live status if Firestore listener is not active
  useEffect(() => {
    let timer
    if (status === 'paid' || status === 'pay_at_venue') {
      timer = setTimeout(() => {
        setStatus('preparing')
      }, 7000)
    }
    return () => clearTimeout(timer)
  }, [status])

  const statusMap = {
    pending_payment: { label: 'Awaiting Payment', color: '#E9774B', icon: '⏳' },
    pay_at_venue: { label: 'Confirmed (Pay at Venue)', color: '#0B3C49', icon: '📝' },
    paid: { label: 'Payment Received', color: '#25D366', icon: '✅' },
    preparing: { label: 'Kitchen Preparing Your Order', color: '#E9774B', icon: '🍳' },
    ready: { label: 'Ready for Table / Pickup', color: '#0B3C49', icon: '🔔' },
    completed: { label: 'Completed', color: '#25D366', icon: '✨' },
    cancelled: { label: 'Cancelled', color: '#D45F33', icon: '❌' },
    refunded: { label: 'Refunded', color: '#888888', icon: '↩️' },
  }

  const curInfo = statusMap[status] || { label: status, color: '#0B3C49', icon: 'ℹ️' }

  return (
    <div className="order-drawer-portal" role="dialog" aria-modal="true" aria-label="Order Confirmation">
      <div className="order-drawer__backdrop" onClick={onClose} />
      <div className="confirmation-modal">
        <div className="confirmation-modal__header">
          <span className="confirmation-icon">{curInfo.icon}</span>
          <h3>Order Confirmed!</h3>
          <p className="confirmation-order-id">Order ID: <strong>{orderId}</strong></p>
        </div>

        <div className="confirmation-status-box" style={{ borderColor: curInfo.color }}>
          <span className="status-badge" style={{ backgroundColor: curInfo.color }}>
            Live Status
          </span>
          <h4>{curInfo.label}</h4>
          <p>
            {status === 'preparing'
              ? 'Our kitchen is actively preparing your fresh order.'
              : status === 'ready'
              ? 'Your order is hot and ready!'
              : 'Thank you! Your order has been placed successfully.'}
          </p>
        </div>

        <div className="confirmation-tips">
          <p>📍 {siteConfig.brand.name} · {siteConfig.brand.location}</p>
          <small>Questions regarding your order? Reach our staff directly at {siteConfig.brand.phone}.</small>
        </div>

        <div className="confirmation-modal__actions">
          <button type="button" className="button button--primary" onClick={onClose}>
            <span>Continue Browsing</span>
            <ArrowIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
