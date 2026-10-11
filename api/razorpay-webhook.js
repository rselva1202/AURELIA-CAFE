import crypto from 'crypto'
import { getFirebaseAdmin } from './_firebaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  const signature = req.headers['x-razorpay-signature']

  // 1. Verify Webhook Signature if secret configured
  if (webhookSecret && !webhookSecret.includes('placeholder')) {
    if (!signature) {
      return res.status(400).json({ error: 'Missing webhook signature' })
    }

    try {
      const shasum = crypto.createHmac('sha256', webhookSecret)
      shasum.update(JSON.stringify(req.body))
      const digest = shasum.digest('hex')

      if (digest !== signature) {
        return res.status(400).json({ error: 'Invalid webhook signature' })
      }
    } catch (err) {
      return res.status(400).json({ error: 'Webhook signature validation error' })
    }
  }

  try {
    const { event, payload } = req.body || {}
    const paymentEntity = payload?.payment?.entity
    const orderEntity = payload?.order?.entity
    const receipt = orderEntity?.receipt || paymentEntity?.notes?.receipt

    const { db } = getFirebaseAdmin()

    // IDEMPOTENCY: check event ID to avoid duplicate processing
    const eventId = req.headers['x-razorpay-event-id'] || `evt_${Date.now()}`
    if (db) {
      const eventRef = db.collection('webhook_events').doc(eventId)
      const eventSnap = await eventRef.get()

      if (eventSnap.exists) {
        console.log(`[Webhook] Duplicate event ${eventId} ignored`)
        return res.status(200).json({ received: true, duplicate: true })
      }

      await eventRef.set({
        eventId,
        event,
        receivedAt: new Date().toISOString(),
      })
    }

    if (receipt && db) {
      const orderRef = db.collection('orders').doc(receipt)
      const orderSnap = await orderRef.get()

      if (orderSnap.exists) {
        let newStatus = null

        switch (event) {
          case 'payment.captured':
          case 'order.paid':
            newStatus = 'paid'
            break
          case 'payment.failed':
            newStatus = 'cancelled'
            break
          case 'refund.created':
          case 'refund.processed':
            newStatus = 'refunded'
            break
          default:
            break
        }

        if (newStatus) {
          await orderRef.update({
            status: newStatus,
            updatedAt: new Date().toISOString(),
            lastWebhookEvent: event,
          })
        }
      }
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('[Webhook Fatal Error]:', err)
    return res.status(500).json({ error: 'Webhook processing error' })
  }
}
