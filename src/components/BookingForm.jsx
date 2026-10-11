import { useState, useEffect } from 'react'
import { siteConfig } from '../data/siteConfig'
import { ArrowIcon } from './UI'

export default function BookingForm({ reservationIntent, onBookingSuccess }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [people, setPeople] = useState('2')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [timeSlot, setTimeSlot] = useState('17:00')
  const [occasion, setOccasion] = useState('Casual dining')
  const [notes, setNotes] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [slotsData, setSlotsData] = useState([])

  const bookingCfg = siteConfig.booking || {
    slotMinutes: 30,
    openFrom: '09:00',
    openTo: '22:00',
    capacityPerSlot: 20,
    maxPartySize: 10,
    daysAhead: 14,
  }

  // Generate Available Time Slots from siteConfig
  useEffect(() => {
    const slots = []
    const [startH, startM] = (bookingCfg.openFrom || '09:00').split(':').map(Number)
    const [endH, endM] = (bookingCfg.openTo || '22:00').split(':').map(Number)
    const interval = bookingCfg.slotMinutes || 30

    let curMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    while (curMinutes <= endMinutes) {
      const h = Math.floor(curMinutes / 60)
      const m = curMinutes % 60
      const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      slots.push(formatted)
      curMinutes += interval
    }
    setSlotsData(slots)
    if (slots.length > 0 && !timeSlot) {
      setTimeSlot(slots[0])
    }
  }, [bookingCfg.openFrom, bookingCfg.openTo, bookingCfg.slotMinutes])

  // Populate intent if passed
  useEffect(() => {
    if (reservationIntent) {
      if (reservationIntent.occasion) setOccasion(reservationIntent.occasion)
      if (reservationIntent.notes) setNotes(reservationIntent.notes)
    }
  }, [reservationIntent])

  // Minimum & Maximum Booking Dates
  const todayIso = new Date().toISOString().slice(0, 10)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + (bookingCfg.daysAhead || 14))
  const maxDateIso = maxDate.toISOString().slice(0, 10)

  const depositPerPerson = siteConfig.payments?.bookingDepositPerPerson || 0
  const partySizeNum = parseInt(people, 10) || 1
  const requiredDeposit = depositPerPerson * partySizeNum

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    if (!name.trim() || name.trim().length < 2) {
      return setErrorMessage('Please enter your full name.')
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '')
    if (!cleanPhone || cleanPhone.length < 10) {
      return setErrorMessage('Please enter a valid phone number (at least 10 digits).')
    }
    if (!consent) {
      return setErrorMessage('Please confirm agreement to booking terms and privacy notice.')
    }

    setSubmitting(true)
    setErrorMessage('')

    try {
      const res = await fetch('/api/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name, phone },
          date,
          timeSlot,
          people: partySizeNum,
          occasion,
          notes,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Booking submission failed.')
      }

      // If a deposit was required, Razorpay would handle deposit payment
      if (data.booking.depositAmount > 0 && typeof window.Razorpay === 'function') {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          amount: data.booking.depositAmount * 100,
          currency: 'INR',
          name: siteConfig.brand.name,
          description: `Table Deposit #${data.booking.bookingId}`,
          order_id: data.booking.razorpayOrderId.startsWith('deposit_mock_') ? undefined : data.booking.razorpayOrderId,
          handler: () => {
            onBookingSuccess(data.booking, data.whatsappUrl)
          },
          prefill: { name, contact: phone },
          modal: {
            ondismiss: () => {
              setSubmitting(false)
              setErrorMessage('Deposit was cancelled. Reservation remains pending.')
            },
          },
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        // Confirmed directly (deposit = 0)
        onBookingSuccess(data.booking, data.whatsappUrl)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error creating booking.')
      setSubmitting(false)
    }
  }

  return (
    <div className="booking-card" id="reservation">
      <div className="booking-card__intro">
        <p className="eyebrow">{bookingCfg.eyebrow || 'Table Booking'}</p>
        <h3>{bookingCfg.title || 'Reserve a Sea-View Table'}</h3>
        <p>{bookingCfg.description || 'Front-row seats for morning coffee, brunch, or sunset overlooking Varkala Cliff.'}</p>
        <div className="booking-card__notes">
          <span>☕ Specialty Coffee & Toasts</span>
          <span>🌊 180° Arabian Sea Horizon</span>
          <span>⚡ Real-Time Instant Confirmation</span>
        </div>
      </div>

      <form className="booking-form" onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <label className="floating-field">
            <span>Your Name *</span>
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="floating-field">
            <span>Phone Number *</span>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="form-row">
          <label className="floating-field">
            <span>Date * (Up to {bookingCfg.daysAhead} days ahead)</span>
            <input
              type="date"
              min={todayIso}
              max={maxDateIso}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <label className="floating-field">
            <span>Time Slot *</span>
            <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
              {slotsData.map((slot) => (
                <option key={slot} value={slot}>
                  {slot} hrs
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label className="floating-field">
            <span>Number of Guests (Max {bookingCfg.maxPartySize})</span>
            <select value={people} onChange={(e) => setPeople(e.target.value)}>
              {Array.from({ length: bookingCfg.maxPartySize || 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={String(n)}>
                  {n} {n === 1 ? 'person' : 'people'}
                </option>
              ))}
            </select>
          </label>

          <label className="floating-field">
            <span>Occasion</span>
            <select value={occasion} onChange={(e) => setOccasion(e.target.value)}>
              {(bookingCfg.occasions || ['Casual dining']).map((occ) => (
                <option key={occ} value={occ}>
                  {occ}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label className="floating-field" style={{ gridColumn: '1 / -1' }}>
            <span>Special Requests / Notes</span>
            <input
              type="text"
              placeholder="e.g. Cliff-edge table preference, quiet seating, high chair..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>

        {depositPerPerson > 0 && (
          <div className="deposit-notice-pill">
            <span>Refundable Deposit: ₹{requiredDeposit} (₹{depositPerPerson} per person)</span>
          </div>
        )}

        <label className="consent-checkbox-wrap" style={{ color: 'var(--cream)' }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            I agree to the <a href="#privacy" target="_blank" style={{ color: 'var(--coral)' }}>Privacy Notice</a> & <a href="#refund" target="_blank" style={{ color: 'var(--coral)' }}>Cancellation Policy</a>.
          </span>
        </label>

        {errorMessage && (
          <div className="form-error-alert" role="alert">
            ⚠️ {errorMessage}
          </div>
        )}

        <div className="booking-form__footer">
          <button
            type="submit"
            className="button button--primary"
            disabled={submitting}
          >
            <span>
              {submitting
                ? 'Reserving Table...'
                : depositPerPerson > 0
                ? `Pay Deposit (₹${requiredDeposit}) & Book`
                : 'Confirm Table Booking'}
            </span>
            <ArrowIcon />
          </button>
        </div>
      </form>
    </div>
  )
}
