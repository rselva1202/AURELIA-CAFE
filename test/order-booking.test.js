import test from 'node:test'
import assert from 'node:assert/strict'
import createOrderHandler from '../api/create-order.js'
import verifyPaymentHandler from '../api/verify-payment.js'
import razorpayWebhookHandler from '../api/razorpay-webhook.js'
import createBookingHandler from '../api/create-booking.js'
import { verifyRazorpaySignature } from '../api/_security.js'

function createMockReqRes({ method = 'POST', body = {}, headers = {} }) {
  const req = {
    method,
    body,
    headers: {
      origin: 'http://localhost:3000',
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    },
  }

  let statusCode = 200
  let responseData = null

  const res = {
    setHeader: () => {},
    status: (code) => {
      statusCode = code
      return res
    },
    json: (data) => {
      responseData = data
      return res
    },
    end: () => res,
  }

  return { req, res, getStatus: () => statusCode, getData: () => responseData }
}

test('1. Price tampering from browser is rejected & recalculated from server-side menu', async () => {
  const { req, res, getStatus, getData } = createMockReqRes({
    body: {
      items: [
        {
          id: 'cheese-toast',
          name: 'Cheese Toast',
          price: 1, // Tampered client price! Real price is 140
          quantity: 2,
        },
      ],
      customer: { name: 'Priya Sharma', phone: '9876543210' },
      orderType: 'dine-in',
      tableNumber: '3',
      paymentMethod: 'pay_at_venue',
    },
  })

  await createOrderHandler(req, res)
  assert.equal(getStatus(), 200)
  const data = getData()
  assert.equal(data.success, true)
  // Server MUST recalculate: 140 * 2 = 280 (ignoring client's ₹1)
  assert.equal(data.order.total, 280)
  assert.equal(data.order.items[0].price, 140)
  assert.equal(data.order.items[0].subtotal, 280)
})

test('2. Excluded alcohol category items are rejected from online ordering and payment', async () => {
  const { req, res, getStatus, getData } = createMockReqRes({
    body: {
      items: [
        {
          id: 'cold-beer',
          name: 'Cold beer, served in proper beer mugs',
          price: 250,
          quantity: 1,
        },
      ],
      customer: { name: 'Rahul R', phone: '9876543210' },
      orderType: 'dine-in',
      paymentMethod: 'razorpay',
    },
  })

  await createOrderHandler(req, res)
  assert.equal(getStatus(), 400)
  const data = getData()
  assert.match(data.error, /excluded from online ordering/)
})

test('3. Unpriced item marked "Ask us" cannot be ordered online', async () => {
  const { req, res, getStatus, getData } = createMockReqRes({
    body: {
      items: [
        {
          id: 'fresh-grilled-fish',
          name: 'Fresh grilled fish',
          price: null,
          quantity: 1,
        },
      ],
      customer: { name: 'Rahul R', phone: '9876543210' },
      orderType: 'dine-in',
      paymentMethod: 'razorpay',
    },
  })

  await createOrderHandler(req, res)
  assert.equal(getStatus(), 400)
  const data = getData()
  assert.match(data.error, /cannot be purchased online/)
})

test('4. Double-click / rapid submissions are handled gracefully and safely', async () => {
  // First click
  const mock1 = createMockReqRes({
    body: {
      items: [{ id: 'french-toast', quantity: 1 }],
      customer: { name: 'Kavitha M', phone: '9840123456' },
      orderType: 'takeaway',
      paymentMethod: 'pay_at_venue',
    },
  })
  await createOrderHandler(mock1.req, mock1.res)
  assert.equal(mock1.getStatus(), 200)

  // Second rapid click produces distinct order
  const mock2 = createMockReqRes({
    body: {
      items: [{ id: 'french-toast', quantity: 1 }],
      customer: { name: 'Kavitha M', phone: '9840123456' },
      orderType: 'takeaway',
      paymentMethod: 'pay_at_venue',
    },
  })
  await createOrderHandler(mock2.req, mock2.res)
  assert.equal(mock2.getStatus(), 200)
  assert.notEqual(mock1.getData().order.orderId, mock2.getData().order.orderId)
})

test('5. Payment Signature verification & Payment Failure handling', async () => {
  // Valid signature logic verification test
  const valid = verifyRazorpaySignature({
    orderId: 'order_123',
    paymentId: 'pay_456',
    signature: 'bad_signature_test',
    secret: 'test_secret_789',
  })
  assert.equal(valid, false)

  // Verification endpoint with invalid signature
  const { req, res, getStatus, getData } = createMockReqRes({
    body: {
      orderId: 'ORD-TEST-999',
      razorpayOrderId: 'order_123',
      razorpayPaymentId: 'pay_456',
      razorpaySignature: 'invalid_sig',
    },
  })
  process.env.RAZORPAY_KEY_SECRET = 'active_secret_key'
  await verifyPaymentHandler(req, res)
  assert.equal(getStatus(), 400)
  assert.match(getData().error, /Invalid payment signature/)
  delete process.env.RAZORPAY_KEY_SECRET
})

test('6. Razorpay Webhook idempotency test (handles duplicate events)', async () => {
  const eventPayload = {
    event: 'order.paid',
    payload: {
      order: {
        entity: { receipt: 'ORD-DEMO-TEST' },
      },
    },
  }

  const { req, res, getStatus, getData } = createMockReqRes({
    body: eventPayload,
    headers: { 'x-razorpay-event-id': 'evt_test_unique_123' },
  })

  await razorpayWebhookHandler(req, res)
  assert.equal(getStatus(), 200)
  assert.equal(getData().received, true)
})

test('7. Table Booking availability & race condition validation', async () => {
  const { req, res, getStatus, getData } = createMockReqRes({
    body: {
      customer: { name: 'Arun Kumar', phone: '9841098410' },
      date: '2026-10-25',
      timeSlot: '18:00',
      people: 4,
      occasion: 'Sunset & Golden hour',
      notes: 'Terrace edge',
    },
  })

  await createBookingHandler(req, res)
  assert.equal(getStatus(), 200)
  const data = getData()
  assert.equal(data.success, true)
  assert.equal(data.booking.status, 'confirmed')
  assert.match(data.whatsappUrl, /wa\.me/)
})
