import { siteConfig } from '../data/siteConfig'

export default function LegalModal({ type, onClose }) {
  if (!type) return null

  const legal = siteConfig.legal || {}

  const titles = {
    privacy: 'Privacy Notice',
    terms: 'Terms & Conditions',
    refund: 'Refund & Cancellation Policy',
  }

  return (
    <div className="order-drawer-portal" role="dialog" aria-modal="true" aria-label={titles[type]}>
      <div className="order-drawer__backdrop" onClick={onClose} />
      <div className="legal-modal-card">
        <div className="legal-modal-header">
          <h3>{titles[type]}</h3>
          <button type="button" className="order-drawer__close" onClick={onClose}>✕</button>
        </div>

        <div className="legal-modal-body">
          <p className="legal-entity-note">
            <strong>Business Entity:</strong> {legal.businessName}<br />
            <strong>GST Identification:</strong> {legal.gstNumber}<br />
            <strong>Support:</strong> {legal.supportPhone} ({legal.supportEmail})<br />
            <strong>Address:</strong> {legal.registeredAddress}
          </p>

          {type === 'privacy' && (
            <div className="legal-text-content">
              <h4>1. Personal Information Collected</h4>
              <p>
                We only collect minimal customer data strictly necessary to fulfill food and drink orders and manage table reservations: namely your Name and Phone Number. We do not store any more personal data than needed.
              </p>
              <h4>2. Payment Security</h4>
              <p>
                No credit/debit card, netbanking, or UPI credentials ever touch or reside on our servers. All digital payments are securely processed end-to-end via Razorpay Checkout in compliance with PCI-DSS standards.
              </p>
              <h4>3. Communication</h4>
              <p>
                Your phone number is solely used to notify you of your order status, booking confirmation, or to reach you regarding dining requirements via SMS or WhatsApp.
              </p>
            </div>
          )}

          {type === 'terms' && (
            <div className="legal-text-content">
              <h4>1. Dining & Orders</h4>
              <p>
                All menu items are prepared fresh on the premises. Items marked "Ask us" are subject to market catch availability and daily freshness.
              </p>
              <h4>2. Table Reservations</h4>
              <p>
                Table bookings are held for up to 15 minutes past the reserved time slot. If you are delayed, please contact our team via phone or WhatsApp.
              </p>
              <h4>3. Demo/Testing Notice</h4>
              <p>
                When demo mode is active, all payments are simulated in Razorpay test mode. No real money or financial liabilities are incurred.
              </p>
            </div>
          )}

          {type === 'refund' && (
            <div className="legal-text-content">
              <h4>1. Order Cancellations</h4>
              <p>
                Online orders may be cancelled within 3 minutes of placement if kitchen preparation has not begun. Please contact staff immediately via WhatsApp or phone.
              </p>
              <h4>2. Refunds</h4>
              <p>
                If an order is cancelled or an item is unavailable, digital payment refunds are processed directly back to the original payment source within 5–7 banking days via Razorpay.
              </p>
              <h4>3. Table Deposit Refunds</h4>
              <p>
                Refundable table booking deposits can be cancelled at least 2 hours before the time slot for a full refund.
              </p>
            </div>
          )}
        </div>

        <div className="legal-modal-footer">
          <button type="button" className="button button--primary" onClick={onClose}>
            <span>Understood</span>
          </button>
        </div>
      </div>
    </div>
  )
}
