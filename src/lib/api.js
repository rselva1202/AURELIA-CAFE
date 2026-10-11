import { menuData } from '../data/menu.js'
import { siteConfig } from '../data/siteConfig.js'

// In-memory fallbacks if localStorage is unavailable or blocked (e.g. private browsing)
let inMemoryOrders = []
let inMemoryBookings = []

const STORAGE_KEYS = {
  ORDERS: 'aurelia_demo_orders',
  BOOKINGS: 'aurelia_demo_bookings',
}

// Helper to access localStorage safely
const safeStorage = {
  get(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key)
        return item ? JSON.parse(item) : null
      }
    } catch (e) {
      console.warn(`[API Adapter] localStorage read error for ${key}:`, e)
    }
    return key === STORAGE_KEYS.ORDERS ? inMemoryOrders : inMemoryBookings
  },
  set(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (e) {
      console.warn(`[API Adapter] localStorage write error for ${key}:`, e)
    }
    if (key === STORAGE_KEYS.ORDERS) inMemoryOrders = value
    if (key === STORAGE_KEYS.BOOKINGS) inMemoryBookings = value
  },
}

// Seed sample orders for realistic demo presentation
export function getSampleOrders() {
  const now = new Date()
  return [
    {
      orderId: 'ORD-DEMO-1001',
      customer: { name: 'Kavitha R', phone: '9840123456' },
      orderType: 'dine-in',
      tableNumber: '4',
      items: [
        { id: 'cheese-toast', name: 'Cheese Toast', price: 140, quantity: 2, subtotal: 280, itemNotes: 'Extra crispy' },
      ],
      total: 280,
      paymentMethod: 'demo_online',
      status: 'preparing',
      createdAt: new Date(now.getTime() - 15 * 60000).toISOString(),
      updatedAt: new Date(now.getTime() - 10 * 60000).toISOString(),
    },
    {
      orderId: 'ORD-DEMO-1002',
      customer: { name: 'Vikram Menon', phone: '9447012345' },
      orderType: 'takeaway',
      tableNumber: null,
      items: [
        { id: 'french-toast', name: 'French Toast', price: 140, quantity: 1, subtotal: 140, itemNotes: '' },
        { id: 'mixed-fruit-muesli', name: 'Mixed Fruit Muesli, Curd & Honey', price: 200, quantity: 1, subtotal: 200, itemNotes: '' },
      ],
      total: 340,
      paymentMethod: 'pay_at_venue',
      status: 'ready',
      createdAt: new Date(now.getTime() - 35 * 60000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 60000).toISOString(),
    },
    {
      orderId: 'ORD-DEMO-1003',
      customer: { name: 'Sophie Miller', phone: '+44 7700 900123' },
      orderType: 'dine-in',
      tableNumber: '2',
      items: [
        { id: 'cheese-tomato-toast', name: 'Cheese Tomato Toast', price: 150, quantity: 1, subtotal: 150, itemNotes: 'Less salt' },
        { id: 'cheese-tuna-toast', name: 'Cheese Tuna Toast', price: 160, quantity: 1, subtotal: 160, itemNotes: '' },
      ],
      total: 310,
      paymentMethod: 'demo_online',
      status: 'completed',
      createdAt: new Date(now.getTime() - 90 * 60000).toISOString(),
      updatedAt: new Date(now.getTime() - 60 * 60000).toISOString(),
    },
  ]
}

// Seed sample bookings
export function getSampleBookings() {
  const today = new Date().toISOString().slice(0, 10)
  return [
    {
      bookingId: 'BKG-DEMO-2001',
      customer: { name: 'Arjun Das', phone: '9995588776' },
      date: today,
      timeSlot: '17:30',
      people: 2,
      occasion: 'Sunset & Golden hour',
      notes: 'Cliff-edge table please',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    },
    {
      bookingId: 'BKG-DEMO-2002',
      customer: { name: 'Aarav & Meera', phone: '9841098410' },
      date: today,
      timeSlot: '19:00',
      people: 4,
      occasion: 'Live music evening',
      notes: 'Celebrating anniversary',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    },
  ]
}

/**
 * 1. createOrder: Validates cart against menu data, recalculates totals, stores order
 */
export async function createOrder({ items, customer, orderType, tableNumber, notes, paymentMethod }) {
  // Validate customer
  const name = customer?.name?.trim()
  const phone = customer?.phone?.replace(/[^0-9+]/g, '').trim()
  if (!name || name.length < 2) {
    throw new Error('Please enter a valid customer name.')
  }
  if (!phone || phone.length < 10) {
    throw new Error('Please enter a valid 10-digit phone number.')
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart cannot be empty.')
  }

  // Recalculate price strictly from menu data
  const menuMap = new Map()
  menuData.categories.forEach((cat) => {
    cat.items.forEach((it) => {
      menuMap.set(it.id, { ...it, category: it.category || cat.id })
    })
  })

  const excluded = siteConfig.ordering?.excludeCategories || ['alcohol']
  let calculatedTotal = 0
  const verifiedItems = []

  for (const clientItem of items) {
    const item = menuMap.get(clientItem.id)
    if (!item) {
      throw new Error(`Item not found on menu: ${clientItem.name || clientItem.id}`)
    }
    if (excluded.includes(item.category) || item.alcoholOnly) {
      throw new Error(`Item "${item.name}" is excluded from online ordering.`)
    }
    if (typeof item.price !== 'number' || item.price <= 0) {
      throw new Error(`Item "${item.name}" is priced on request and cannot be ordered online.`)
    }

    const qty = Math.max(1, parseInt(clientItem.quantity, 10) || 1)
    calculatedTotal += item.price * qty
    verifiedItems.push({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: qty,
      subtotal: item.price * qty,
      itemNotes: typeof clientItem.itemNotes === 'string' ? clientItem.itemNotes.slice(0, 150) : '',
    })
  }

  const orderId = `ORD-DEMO-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`
  const initialStatus = paymentMethod === 'pay_at_venue' ? 'pay_at_venue' : 'paid'

  const orderRecord = {
    orderId,
    customer: { name, phone },
    orderType: orderType === 'takeaway' ? 'takeaway' : 'dine-in',
    tableNumber: orderType === 'takeaway' ? null : (tableNumber || null),
    notes: typeof notes === 'string' ? notes.slice(0, 300) : '',
    items: verifiedItems,
    total: calculatedTotal,
    paymentMethod,
    status: initialStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Save to storage
  const currentOrders = safeStorage.get(STORAGE_KEYS.ORDERS) || getSampleOrders()
  safeStorage.set(STORAGE_KEYS.ORDERS, [orderRecord, ...currentOrders])

  return { success: true, order: orderRecord }
}

/**
 * 2. getOrders: Returns all orders
 */
export async function getOrders() {
  let stored = safeStorage.get(STORAGE_KEYS.ORDERS)
  if (!stored || stored.length === 0) {
    stored = getSampleOrders()
    safeStorage.set(STORAGE_KEYS.ORDERS, stored)
  }
  return stored
}

/**
 * 3. updateOrderStatus: Updates order status (preparing, ready, completed, cancelled)
 */
export async function updateOrderStatus(orderId, newStatus) {
  const orders = await getOrders()
  const updated = orders.map((o) => {
    if (o.orderId === orderId) {
      return { ...o, status: newStatus, updatedAt: new Date().toISOString() }
    }
    return o
  })
  safeStorage.set(STORAGE_KEYS.ORDERS, updated)
  return updated.find((o) => o.orderId === orderId)
}

/**
 * 4. getAvailableSlots: Generates slots from config with realistic "Fully booked" seeds
 */
export async function getAvailableSlots(dateString) {
  const cfg = siteConfig.booking || {
    slotMinutes: 30,
    openFrom: '09:00',
    openTo: '22:00',
    capacityPerSlot: 20,
  }

  const slots = []
  const [startH, startM] = (cfg.openFrom || '09:00').split(':').map(Number)
  const [endH, endM] = (cfg.openTo || '22:00').split(':').map(Number)
  const interval = cfg.slotMinutes || 30

  let curMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  // Realistic seed: popular sunset slots (17:30 and 18:30) are pre-seeded as fully booked
  const fullyBookedSeeds = ['17:30', '18:30']

  while (curMinutes <= endMinutes) {
    const h = Math.floor(curMinutes / 60)
    const m = curMinutes % 60
    const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

    const isFullyBooked = fullyBookedSeeds.includes(time)

    slots.push({
      time,
      available: !isFullyBooked,
      remainingSeats: isFullyBooked ? 0 : cfg.capacityPerSlot || 20,
      label: `${time} hrs`,
    })

    curMinutes += interval
  }

  return slots
}

/**
 * 5. createBooking: Creates table booking and returns booking summary with WhatsApp URL
 */
export async function createBooking({ customer, date, timeSlot, people, occasion, notes }) {
  const name = customer?.name?.trim()
  const phone = customer?.phone?.replace(/[^0-9+]/g, '').trim()
  if (!name || name.length < 2) {
    throw new Error('Please enter your full name.')
  }
  if (!phone || phone.length < 10) {
    throw new Error('Please enter a valid phone number.')
  }
  if (!date || !timeSlot) {
    throw new Error('Please choose a date and time slot.')
  }

  // Check if chosen slot is fully booked
  const slots = await getAvailableSlots(date)
  const slotObj = slots.find((s) => s.time === timeSlot)
  if (slotObj && !slotObj.available) {
    throw new Error(`The ${timeSlot} hrs slot is fully booked. Please select another time slot.`)
  }

  const bookingId = `BKG-DEMO-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`
  const bookingRecord = {
    bookingId,
    customer: { name, phone },
    date,
    timeSlot,
    people: parseInt(people, 10) || 2,
    occasion: occasion || 'Casual dining',
    notes: typeof notes === 'string' ? notes.slice(0, 300) : '',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  }

  const currentBookings = safeStorage.get(STORAGE_KEYS.BOOKINGS) || getSampleBookings()
  safeStorage.set(STORAGE_KEYS.BOOKINGS, [bookingRecord, ...currentBookings])

  // Build WhatsApp click-to-chat summary
  const summaryLines = [
    `Table Reservation · ${siteConfig.brand.name}`,
    `Booking ID: ${bookingId}`,
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Guests: ${bookingRecord.people} people`,
    `Date: ${date}`,
    `Time slot: ${timeSlot} hrs`,
    occasion ? `Occasion: ${occasion}` : null,
    notes ? `Notes: ${notes}` : null,
    `Status: Confirmed (Demo)`,
  ].filter(Boolean)

  const whatsappUrl = `https://wa.me/${siteConfig.brand.whatsapp}?text=${encodeURIComponent(summaryLines.join('\n'))}`

  return {
    success: true,
    booking: bookingRecord,
    whatsappUrl,
  }
}

/**
 * 6. getBookings: Returns all bookings
 */
export async function getBookings() {
  let stored = safeStorage.get(STORAGE_KEYS.BOOKINGS)
  if (!stored || stored.length === 0) {
    stored = getSampleBookings()
    safeStorage.set(STORAGE_KEYS.BOOKINGS, stored)
  }
  return stored
}

/**
 * 7. updateBookingStatus: Updates booking status (confirmed, seated, no_show, cancelled)
 */
export async function updateBookingStatus(bookingId, newStatus) {
  const list = await getBookings()
  const updated = list.map((b) => (b.bookingId === bookingId ? { ...b, status: newStatus } : b))
  safeStorage.set(STORAGE_KEYS.BOOKINGS, updated)
  return updated.find((b) => b.bookingId === bookingId)
}

/**
 * 8. resetDemoData: Clears local storage and reloads seed demo data
 */
export function resetDemoData() {
  safeStorage.set(STORAGE_KEYS.ORDERS, getSampleOrders())
  safeStorage.set(STORAGE_KEYS.BOOKINGS, getSampleBookings())
}

/**
 * 9. loadSampleOrders: Appends sample data to demonstrate admin
 */
export function loadSampleOrders() {
  const currentOrders = safeStorage.get(STORAGE_KEYS.ORDERS) || []
  safeStorage.set(STORAGE_KEYS.ORDERS, [...getSampleOrders(), ...currentOrders])
}
