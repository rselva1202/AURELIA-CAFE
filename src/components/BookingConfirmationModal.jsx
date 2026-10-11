import { siteConfig } from '../data/siteConfig'
import { ArrowIcon } from './UI'

export default function BookingConfirmationModal({ booking, whatsappUrl, onClose }) {
  if (!booking) return null

  return (
    <div className="order-drawer-portal" role="dialog" aria-modal="true" aria-label="Booking Confirmation">
      <div className="order-drawer__backdrop" onClick={onClose} />
      <div className="confirmation-modal">
        <div className="confirmation-modal__header">
          <span className="confirmation-icon">🌅</span>
          <h3>Table Reserved!</h3>
          <p className="confirmation-order-id">
            Booking ID: <strong>{booking.bookingId}</strong>
          </p>
        </div>

        <div className="confirmation-status-box" style={{ borderColor: '#0B3C49' }}>
          <span className="status-badge" style={{ backgroundColor: '#0B3C49' }}>
            Confirmed (Demo)
          </span>
          <h4>{booking.date} · {booking.timeSlot} hrs</h4>
          <p>
            Table reserved for <strong>{booking.people} guests</strong> under {booking.customer.name}.
            {booking.notes && <span style={{ display: 'block', marginTop: '0.3rem' }}>Note: "{booking.notes}"</span>}
          </p>
        </div>

        <div className="booking-whatsapp-prompt">
          <p>Send a WhatsApp confirmation summary directly to the cafe:</p>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="button button--primary booking-wa-btn"
            >
              <span>Send Summary on WhatsApp</span>
              <ArrowIcon />
            </a>
          )}
        </div>

        <div className="confirmation-tips">
          <p>📍 {siteConfig.brand.name} · {siteConfig.brand.location}</p>
          <small>We hold reserved tables for 15 minutes past slot time.</small>
        </div>

        <div className="confirmation-modal__actions">
          <button type="button" className="button button--light" onClick={onClose}>
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  )
}
