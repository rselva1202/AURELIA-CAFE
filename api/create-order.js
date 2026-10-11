import Razorpay from 'razorpay'
import { menuData } from '../src/data/menu.js'
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
    return res.status(429).json({ error: 'Too many requests. Please try again shortly.' })
  }

  if (checkHoneypot(req.body)) {
    return res.status(400).json({ error: 'Invalid submission' })
  }

  try {
    const { items, customer, orderType, tableNumber, notes, paymentMethod } = req.body || {}

    // 1. Validate Customer
    const custVal = validateCustomer(customer)
    if (!custVal.valid) {
      return res.status(400).json({ error: custVal.error })
    }

    // 2. Validate Order Type
    const allowedTypes = siteConfig.ordering?.types || ['dine-in', 'takeaway']
    const cleanOrderType = allowedTypes.includes(orderType) ? orderType : 'dine-in'

    if (cleanOrderType === 'dine-in' && !tableNumber) {
      // If table number not provided in dine-in, check if table was passed
    }

    // 3. SERVER-SIDE PRICE RECALCULATION & EXCLUSION CHECK
    // Never trust prices or totals passed from browser
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart cannot be empty.' })
    }

    const serverMenuMap = new Map()
    menuData.categories.forEach((cat) => {
      cat.items.forEach((it) => {
        serverMenuMap.set(it.id, { ...it, category: it.category || cat.id })
      })
    })

    const excludedCats = siteConfig.ordering?.excludeCategories || ['alcohol']
    let calculatedTotal = 0
    const verifiedItems = []

    for (const clientItem of items) {
      const serverItem = serverMenuMap.get(clientItem.id)
      if (!serverItem) {
        return res.status(400).json({ error: `Item not found on menu: ${clientItem.name || clientItem.id}` })
      }

      // Check excluded category (e.g., alcohol)
      if (excludedCats.includes(serverItem.category) || serverItem.alcoholOnly) {
        return res.status(400).json({
          error: `Item "${serverItem.name}" is excluded from online ordering and payments.`,
        })
      }

      // Check price: Items with price: null ("Ask us") cannot be ordered online
      if (typeof serverItem.price !== 'number' || serverItem.price <= 0) {
        return res.status(400).json({
          error: `Item "${serverItem.name}" is marked "Ask us" and cannot be purchased online.`,
        })
      }

      const quantity = Math.max(1, Math.min(50, parseInt(clientItem.quantity, 10) || 1))
      calculatedTotal += serverItem.price * quantity

      verifiedItems.push({
        id: serverItem.id,
        name: serverItem.name,
        price: serverItem.price,
        quantity,
        subtotal: serverItem.price * quantity,
        itemNotes: typeof clientItem.notes === 'string' ? clientItem.notes.slice(0, 150) : '',
      })
    }

    const minOrder = siteConfig.ordering?.minOrder || 0
    if (calculatedTotal < minOrder) {
      return res.status(400).json({ error: `Minimum order amount is ₹${minOrder}.` })
    }

    // 4. Determine Initial Status
    const isPayAtVenue = paymentMethod === 'pay_at_venue'
    const initialStatus = isPayAtVenue ? 'pay_at_venue' : 'pending_payment'
    const orderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

    // 5. Razorpay Order Creation (if paying online)
    let razorpayOrderId = null
    const paymentMode = siteConfig.payments?.mode || 'test'

    if (!isPayAtVenue && paymentMode !== 'off') {
      const rzpKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID
      const rzpSecret = process.env.RAZORPAY_KEY_SECRET

      if (rzpKeyId && rzpSecret && !rzpKeyId.includes('placeholder')) {
        try {
          const razorpay = new Razorpay({
            key_id: rzpKeyId,
            key_secret: rzpSecret,
          })

          const rzpOrder = await razorpay.orders.create({
            amount: calculatedTotal * 100, // amount in paise
            currency: siteConfig.payments?.currency || 'INR',
            receipt: orderId,
            notes: {
              customerName: custVal.name,
              customerPhone: custVal.phone,
              orderType: cleanOrderType,
            },
          })
          razorpayOrderId = rzpOrder.id
        } catch (rzpErr) {
          console.error('[Razorpay Create Order Error]:', rzpErr)
          // In test/demo mode, generate a mock Razorpay order id if keys fail
          razorpayOrderId = `order_test_${Date.now()}`
        }
      } else {
        // Test / demo fallback ID
        razorpayOrderId = `order_demo_${Date.now()}`
      }
    }

    // 6. Save Order to Firestore
    const orderRecord = {
      orderId,
      customer: {
        name: custVal.name,
        phone: custVal.phone,
      },
      orderType: cleanOrderType,
      tableNumber: cleanOrderType === 'dine-in' ? tableNumber || null : null,
      notes: typeof notes === 'string' ? notes.slice(0, 300) : '',
      items: verifiedItems,
      total: calculatedTotal,
      currency: 'INR',
      status: initialStatus, // pending_payment, pay_at_venue, paid, etc.
      paymentMethod: isPayAtVenue ? 'pay_at_venue' : 'razorpay',
      paymentMode,
      razorpayOrderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const { db } = getFirebaseAdmin()
    if (db) {
      try {
        await db.collection('orders').doc(orderId).set(orderRecord)
      } catch (dbErr) {
        console.warn('[Firestore] Warning saving order to Firestore:', dbErr.message)
      }
    }

    return res.status(200).json({
      success: true,
      order: orderRecord,
      razorpayOrderId,
      keyId: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    })
  } catch (error) {
    console.error('[Create Order Fatal Error]:', error)
    return res.status(500).json({ error: 'Failed to process order. Please try again.' })
  }
}
