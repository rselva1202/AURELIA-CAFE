import { useEffect, useState } from 'react'
import { siteConfig } from '../data/siteConfig'
import { updateOrderStatus } from '../lib/api'
import { ArrowIcon } from './UI'

export default function OrderConfirmationModal({ order, onClose }) {
  // Step tracker: 0 = Received, 1 = Preparing, 2 = Ready
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { key: 'received', label: 'Order Received', desc: 'Your order was verified and logged into kitchen queue.' },
    { key: 'preparing', label: 'Preparing', desc: 'Fresh coffee is brewing & toasts are on the grill.' },
    { key: 'ready', label: 'Ready', desc: 'Your order is hot and ready for your table or pickup!' },
  ]

  // Animated status tracker advancing on timers (4s -> Preparing, 9s -> Ready)
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setCurrentStep(1)
      if (order?.orderId) {
        updateOrderStatus(order.orderId, 'preparing')
      }
    }, 4000)

    const timer2 = setTimeout(() => {
      setCurrentStep(2)
      if (order?.orderId) {
        updateOrderStatus(order.orderId, 'ready')
      }
    }, 9000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [order?.orderId])

  if (!order) return null

  return (
    <div className="order-drawer-portal" role="dialog" aria-modal="true" aria-label="Order Confirmation">
      <div className="order-drawer__backdrop" onClick={onClose} />
      <div className="confirmation-modal">
        <div className="confirmation-modal__header">
          <span className="confirmation-icon">🎉</span>
          <h3>Order Confirmed!</h3>
          <p className="confirmation-order-id">
            Order ID: <strong>{order.orderId}</strong> · {order.orderType === 'dine-in' ? `Table #${order.tableNumber || '?'}` : 'Takeaway'}
          </p>
        </div>

        {/* Animated 3-Stage Status Tracker */}
        <div className="status-tracker-container">
          <div className="tracker-steps-line" />
          <div className="tracker-steps-row">
            {steps.map((step, idx) => {
              const isPassed = idx <= currentStep
              const isCurrent = idx === currentStep

              return (
                <div
                  key={step.key}
                  className={`tracker-step-item ${isPassed ? 'is-passed' : ''} ${isCurrent ? 'is-current' : ''}`}
                >
                  <div className="tracker-step-circle">
                    {idx < currentStep ? '✓' : idx + 1}
                  </div>
                  <span className="tracker-step-title">{step.label}</span>
                </div>
              )
            })}
          </div>

          <div className="tracker-current-banner">
            <span className="tracker-live-pulse" />
            <p>
              <strong>{steps[currentStep].label}:</strong> {steps[currentStep].desc}
            </p>
          </div>
        </div>

        {/* Items Summary */}
        <div className="confirmation-items-summary">
          <h5>Order Summary (Total: ₹{order.total})</h5>
          <ul className="confirmation-items-list">
            {(order.items || []).map((it, idx) => (
              <li key={idx}>
                <span>{it.name} x {it.quantity}</span>
                <strong>₹{it.subtotal}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="confirmation-tips">
          <p>📍 {siteConfig.brand.name} · {siteConfig.brand.location}</p>
          <small>Payment Mode: {order.paymentMethod === 'pay_at_venue' ? 'Pay at Table' : 'Online Payment (UPI / Card)'}</small>
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
