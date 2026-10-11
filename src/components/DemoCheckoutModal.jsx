import { useState, useEffect } from 'react'
import { ArrowIcon } from './UI'

export default function DemoCheckoutModal({
  isOpen,
  total,
  customerName,
  onClose,
  onSuccess,
  onSimulateFailure,
}) {
  const [activeTab, setActiveTab] = useState('upi') // 'upi' | 'card'
  const [upiId, setUpiId] = useState('demo@okaxis')
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvv, setCardCvv] = useState('789')
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState('idle') // 'idle' | 'processing' | 'success' | 'failed'
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (isOpen) {
      setStatus('idle')
      setProcessing(false)
      setErrorMessage('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handlePay = () => {
    if (processing) return
    setProcessing(true)
    setStatus('processing')
    setErrorMessage('')

    // Exactly 2-second processing animation
    setTimeout(() => {
      setProcessing(false)
      setStatus('success')
      setTimeout(() => {
        onSuccess?.()
      }, 900)
    }, 2000)
  }

  const handleFail = (e) => {
    e.preventDefault()
    if (processing) return
    setProcessing(true)
    setStatus('processing')
    setErrorMessage('')

    setTimeout(() => {
      setProcessing(false)
      setStatus('failed')
      setErrorMessage('Payment simulation declined by bank (Demo test state).')
      onSimulateFailure?.()
    }, 2000)
  }

  return (
    <div className="order-drawer-portal" role="dialog" aria-modal="true" aria-label="Demo Checkout Modal">
      <div className="order-drawer__backdrop" onClick={!processing ? onClose : undefined} />
      <div className="demo-checkout-modal">
        <div className="demo-checkout-header">
          <div>
            <h3>Simulated Checkout</h3>
            <span className="demo-checkout-badge">Test payment: no money is charged</span>
          </div>
          {!processing && (
            <button type="button" className="order-drawer__close" onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        <div className="demo-checkout-body">
          {/* Amount Overview */}
          <div className="demo-checkout-summary">
            <span>Amount Payable</span>
            <strong>₹{total}</strong>
            <small>Payer: {customerName || 'Guest'}</small>
          </div>

          {/* Payment Tabs: UPI vs Card */}
          {status !== 'success' && (
            <>
              <div className="demo-payment-tabs">
                <button
                  type="button"
                  className={`demo-pay-tab ${activeTab === 'upi' ? 'is-active' : ''}`}
                  onClick={() => !processing && setActiveTab('upi')}
                >
                  📱 UPI / QR
                </button>
                <button
                  type="button"
                  className={`demo-pay-tab ${activeTab === 'card' ? 'is-active' : ''}`}
                  onClick={() => !processing && setActiveTab('card')}
                >
                  💳 Credit / Debit Card
                </button>
              </div>

              {activeTab === 'upi' ? (
                <div className="demo-tab-panel">
                  <label>
                    <span>Simulated UPI ID / VPA</span>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      disabled={processing}
                    />
                  </label>
                  <p className="demo-input-hint">
                    Supports instant UPI approval simulation (Google Pay, PhonePe, Paytm).
                  </p>
                </div>
              ) : (
                <div className="demo-tab-panel">
                  <label>
                    <span>Demo Card Number</span>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      disabled={processing}
                    />
                  </label>
                  <div className="demo-card-subrow">
                    <label>
                      <span>Valid Thru</span>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        disabled={processing}
                      />
                    </label>
                    <label>
                      <span>CVV</span>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        disabled={processing}
                      />
                    </label>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Processing Animation state */}
          {status === 'processing' && (
            <div className="demo-processing-box" aria-live="polite">
              <div className="demo-spinner" />
              <p>Simulating 2-second bank authorization...</p>
              <small>Securing simulated test tokens</small>
            </div>
          )}

          {/* Success state */}
          {status === 'success' && (
            <div className="demo-success-box" aria-live="polite">
              <span className="demo-status-icon">✓</span>
              <h4>Payment Approved!</h4>
              <p>Redirecting to order tracker...</p>
            </div>
          )}

          {/* Failure state */}
          {status === 'failed' && (
            <div className="demo-failed-box" role="alert">
              <span className="demo-status-icon">✕</span>
              <h4>Payment Simulation Failed</h4>
              <p>{errorMessage}</p>
              <button
                type="button"
                className="button button--light demo-retry-btn"
                onClick={() => setStatus('idle')}
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {status === 'idle' && (
          <div className="demo-checkout-footer">
            <button
              type="button"
              className="button button--primary demo-pay-submit-btn"
              onClick={handlePay}
              disabled={processing}
            >
              <span>Authorize ₹{total} (Demo)</span>
              <ArrowIcon />
            </button>

            <a
              href="#simulate-fail"
              className="demo-fail-simulation-link"
              onClick={handleFail}
            >
              Simulate failure
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
