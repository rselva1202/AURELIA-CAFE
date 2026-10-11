import { getFirebaseAdmin } from './_firebaseAdmin.js'
import { applySecurityHeaders, checkRateLimit, verifyRazorpaySignature } from './_security.js'

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

  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body || {}

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET

    // If real keys are present and not placeholder, verify signature
    if (secret && !secret.includes('placeholder') && razorpaySignature) {
      const isValid = verifyRazorpaySignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
        secret,
      })

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid payment signature' })
      }
    } else {
      // In demo test mode, accept simulated test payment verification
      console.log(`[Verify Payment] Demo mode verification for ${orderId}`)
    }

    // Update Firestore status to 'paid'
    const { db } = getFirebaseAdmin()
    let updatedOrder = null

    if (db) {
      try {
        const orderRef = db.collection('orders').doc(orderId)
        const snap = await orderRef.get()

        if (snap.exists) {
          const updateData = {
            status: 'paid',
            razorpayPaymentId: razorpayPaymentId || `pay_mock_${Date.now()}`,
            razorpaySignature: razorpaySignature || null,
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          await orderRef.update(updateData)
          updatedOrder = { ...snap.data(), ...updateData }
        }
      } catch (dbErr) {
        console.warn('[Firestore] Warning updating order to paid:', dbErr.message)
      }
    }

    return res.status(200).json({
      success: true,
      status: 'paid',
      orderId,
      order: updatedOrder,
    })
  } catch (error) {
    console.error('[Verify Payment Fatal Error]:', error)
    return res.status(500).json({ error: 'Payment verification failed' })
  }
}
