import Razorpay from 'razorpay'
import { siteConfig } from '../src/data/siteConfig.js'
import { getFirebaseAdmin } from './_firebaseAdmin.js'
import { applySecurityHeaders, checkRateLimit, checkHoneypot, validateCustomer } from './_security.js'

export default async function handler(req, res) {
  applySecurityHeaders(req, res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!checkRateLimit(req)) {
    return res.status(429).json({ error: 'Too many requests' })
  }

  if (checkHoneypot(req.body)) {
    return res.status(400).json({ error: 'Invalid submission' })
  }

  try {
    const { customer, date, timeSlot, people, occasion, notes } = req.body || {}

    // 1. Validate customer
    const custVal = validateCustomer(customer)
    if (!custVal.valid) {
      return res.status(400).json({ error: custVal.error })
    }

    if (!date || !timeSlot) {
      return res.status(400).json({ error: 'Reservation date and time slot are required.' })
    }

    const partySize = parseInt(people, 10) || 2
    const maxParty = siteConfig.booking?.maxPartySize || 10
    if (partySize < 1 || partySize > maxParty) {
      return res.status(400).json({ error: `Party size must be between 1 and ${maxParty} people.` })
    }

    const slotCapacity = siteConfig.booking?.capacityPerSlot || 20
    const slotKey = `${date}_${timeSlot.replace(/[^a-zA-Z0-9]/g, '_')}`
    const bookingId = `BKG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

    // 2. FIRESTORE TRANSACTION: PREVENT DOUBLE BOOKING / OVER-CAPACITY RACE CONDITIONS
    const { db } = getFirebaseAdmin()

    if (db) {
      const slotRef = db.collection('slot_capacities').doc(slotKey)

      await db.runTransaction(async (transaction) => {
        const slotDoc = await transaction.get(slotRef)
        const currentCount = slotDoc.exists ? (slotDoc.data().bookedPeople || 0) : 0

        if (currentCount + partySize > slotCapacity) {
          throw new Error('SLOT_FULLY_BOOKED')
        }

        transaction.set(slotRef, {
          date,
          timeSlot,
          bookedPeople: currentCount + partySize,
          capacity: slotCapacity,
          updatedAt: new Date().toISOString(),
        }, { merge: true })
      })
    }

    // 3. Optional Booking Deposit
    const depositPerPerson = siteConfig.payments?.bookingDepositPerPerson || 0
    const depositAmount = depositPerPerson * partySize
    let razorpayOrderId = null

    if (depositAmount > 0 && siteConfig.payments?.mode !== 'off') {
      const rzpKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID
      const rzpSecret = process.env.RAZORPAY_KEY_SECRET

      if (rzpKeyId && rzpSecret && !rzpKeyId.includes('placeholder')) {
        try {
          const razorpay = new Razorpay({ key_id: rzpKeyId, key_secret: rzpSecret })
          const rzpOrder = await razorpay.orders.create({
            amount: depositAmount * 100,
            currency: 'INR',
            receipt: bookingId,
            notes: { customerName: custVal.name, bookingId },
          })
          razorpayOrderId = rzpOrder.id
        } catch (err) {
          console.warn('[Razorpay Booking Deposit Warning]:', err.message)
          razorpayOrderId = `deposit_mock_${Date.now()}`
        }
      } else {
        razorpayOrderId = `deposit_mock_${Date.now()}`
      }
    }

    // 4. Save Booking Document
    const initialStatus = depositAmount > 0 ? 'pending' : 'confirmed'
    const cancellationToken = `cancel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    const bookingDoc = {
      bookingId,
      customer: {
        name: custVal.name,
        phone: custVal.phone,
      },
      date,
      timeSlot,
      people: partySize,
      occasion: occasion || 'Casual dining',
      notes: typeof notes === 'string' ? notes.slice(0, 300) : '',
      depositAmount,
      razorpayOrderId,
      status: initialStatus, // pending, confirmed, cancelled, completed, no_show
      cancellationToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (db) {
      await db.collection('bookings').doc(bookingId).set(bookingDoc)
    }

    // 5. Generate WhatsApp click-to-chat URL for Cafe
    const whatsappMsg = [
      `Table Reservation Request · ${siteConfig.brand.name}`,
      `Booking ID: ${bookingId}`,
      `Name: ${custVal.name}`,
      `Phone: ${custVal.phone}`,
      `Guests: ${partySize} people`,
      `Date: ${date}`,
      `Time slot: ${timeSlot}`,
      occasion ? `Occasion: ${occasion}` : null,
      notes ? `Notes: ${notes}` : null,
      depositAmount > 0 ? `Deposit: ₹${depositAmount} (${initialStatus})` : 'Status: Confirmed',
    ].filter(Boolean).join('\n')

    const whatsappUrl = `https://wa.me/${siteConfig.brand.whatsapp}?text=${encodeURIComponent(whatsappMsg)}`

    return res.status(200).json({
      success: true,
      booking: bookingDoc,
      whatsappUrl,
      cancellationUrl: `/booking-status?id=${bookingId}&token=${cancellationToken}&action=cancel`,
    })
  } catch (error) {
    if (error.message === 'SLOT_FULLY_BOOKED') {
      return res.status(409).json({ error: 'This time slot is fully booked. Please select another slot.' })
    }
    console.error('[Create Booking Error]:', error)
    return res.status(500).json({ error: 'Failed to complete booking. Please try again.' })
  }
}
