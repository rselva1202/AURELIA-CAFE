import crypto from 'crypto'

// Simple in-memory rate limiter per IP for serverless execution
const rateLimitMap = new Map()

export function applySecurityHeaders(req, res) {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Razorpay-Signature')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
}

export function checkRateLimit(req, limit = 40, windowMs = 60000) {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1'
  const now = Date.now()
  const userRecord = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs }

  if (now > userRecord.resetAt) {
    userRecord.count = 1
    userRecord.resetAt = now + windowMs
  } else {
    userRecord.count += 1
  }

  rateLimitMap.set(ip, userRecord)

  if (userRecord.count > limit) {
    return false
  }
  return true
}

export function validateCustomer(customer = {}) {
  const name = typeof customer.name === 'string' ? customer.name.trim() : ''
  const phone = typeof customer.phone === 'string' ? customer.phone.replace(/[^0-9+]/g, '').trim() : ''
  
  if (!name || name.length < 2 || name.length > 80) {
    return { valid: false, error: 'Customer name must be between 2 and 80 characters.' }
  }
  if (!phone || phone.length < 10 || phone.length > 15) {
    return { valid: false, error: 'Valid customer phone number (at least 10 digits) is required.' }
  }

  return { valid: true, name, phone }
}

export function checkHoneypot(body = {}) {
  // If honeypot field is filled, reject bot request
  if (body.website || body.company || body.hp_field) {
    return true
  }
  return false
}

export function verifyRazorpaySignature({ orderId, paymentId, signature, secret }) {
  if (!orderId || !paymentId || !signature || !secret) {
    return false
  }
  const body = `${orderId}|${paymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex')
  return expectedSignature === signature
}
