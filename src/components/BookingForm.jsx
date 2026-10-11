import { useState, useEffect } from 'react'
import { siteConfig } from '../data/siteConfig'
import { getAvailableSlots, createBooking } from '../lib/api'
import { ArrowIcon } from './UI'

export default function BookingForm({ reservationIntent, onBookingSuccess }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [people, setPeople] = useState('2')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [timeSlot, setTimeSlot] = useState('')
  const [occasion, setOccasion] = useState('Casual dining')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [slotsList, setSlotsList] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const bookingCfg = siteConfig.booking || {
    slotMinutes: 30,
    openFrom: '09:00',
    openTo: '22:00',
    capacityPerSlot: 20,
    maxPartySize: 10,
    daysAhead: 14,
  }

  // Load available slots from adapter whenever date changes
  useEffect(() => {
    let active = true
    setLoadingSlots(true)
    getAvailableSlots(date).then((slots) => {
      if (!active) return
      setSlotsList(slots)
      // Pick first available slot by default
      const firstAvail = slots.find((s) => s.available)
      if (firstAvail && !timeSlot) {
        setTimeSlot(firstAvail.time)
      }
      setLoadingSlots(false)
    })
    return () => {
      active = false
    }
  }, [date])

  // Fill intent if passed
  useEffect(() => {
    if (reservationIntent) {
      if (reservationIntent.occasion) setOccasion(reservationIntent.occasion)
      if (reservationIntent.notes) setNotes(reservationIntent.notes)
    }
  }, [reservationIntent])

  const todayIso = new Date().toISOString().slice(0, 10)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + (bookingCfg.daysAhead || 14))
  const maxDateIso = maxDate.toISOString().slice(0, 10)

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
    if (!timeSlot) {
      return setErrorMessage('Please select an available time slot.')
    }

    setSubmitting(true)
    setErrorMessage('')

    try {
      const res = await createBooking({
        customer: { name, phone },
        date,
        timeSlot,
        people: parseInt(people, 10) || 2,
        occasion,
        notes,
      })

      if (res.success) {
        onBookingSuccess(res.booking, res.whatsappUrl)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error creating booking.')
    } finally {
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
          <span>☕ Artisanal Coffee & Toasts</span>
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
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              disabled={loadingSlots}
            >
              {slotsList.map((slot) => (
                <option
                  key={slot.time}
                  value={slot.time}
                  disabled={!slot.available}
                >
                  {slot.time} hrs {!slot.available ? '— Fully Booked' : ''}
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
            <span>{submitting ? 'Reserving Table...' : 'Confirm Table Booking'}</span>
            <ArrowIcon />
          </button>
        </div>
      </form>
    </div>
  )
}
