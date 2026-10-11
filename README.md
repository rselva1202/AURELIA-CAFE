# Aurelia Cafe — Reusable Sea-View Cafe & Kitchen Website Demo

A premium, motion-rich website for **Aurelia Cafe**, a sea-view cafe and kitchen in Varkala, Kerala. Built with React, Vite, GSAP, ScrollTrigger, Lenis, and modern CSS variable design tokens.

Extended with full **online food & drink ordering**, **table booking with double-booking prevention**, and a **pure client-side Demo mode** (`src/lib/api.js`) with an **Owner Admin Dashboard** (`/admin-demo` and `/admin`).

Everything is driven by configuration in `src/data/siteConfig.js` and `src/data/menu.js`, making rebranding and client handover achievable in under 30 minutes.

---

## 🎭 Demo Mode Architecture (`src/lib/api.js`)

This project includes a **100% backend-free demo experience** designed for GitHub Pages or static pitching:
- **Zero Real Keys or Servers Required**: No Firebase secrets or Razorpay keys needed to run or test.
- **API Adapter (`src/lib/api.js`)**: All ordering, booking, slot calculation, and administrative operations are abstracted behind a unified adapter.
- **Resilient Persistence**: Uses browser `localStorage` wrapped in `try/catch` with an automatic in-memory array fallback (works in restricted/incognito modes).
- **Simulated Payment Gateway (`DemoCheckoutModal.jsx`)**: Full modal with UPI and Card tabs, "Test payment: no money is charged" label, a realistic 2-second processing animation, and a "Simulate failure" link.
- **Order Tracking**: Interactive order confirmation with live status transitions (Received → Preparing → Ready).
- **Table Booking**: Slot availability generator with pre-seeded disabled "Fully booked" slots and WhatsApp confirmation click-to-chat.
- **Demo Admin Portal (`/admin-demo` or `?admin-demo`)**: Real-time management screen featuring today's metrics, status progression buttons, "+ Load sample orders", and "↺ Reset demo data".

---

## 🔌 How to Plug in a Real Backend

Because all React components communicate **only** with `src/lib/api.js`, transitioning to a real production backend (Vercel Serverless, Node.js/Express, Supabase, or Firebase) requires **zero UI changes**:

1. **Open `src/lib/api.js`**:
   Replace the local storage methods with HTTP requests to your backend:
   ```javascript
   // Example swap in src/lib/api.js
   export async function createOrder(orderData) {
     const res = await fetch('/api/create-order', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(orderData)
     });
     return res.json();
   }
   ```
2. **Configure Payment Keys**:
   - In `src/data/siteConfig.js`, set `payments.mode: "test"` (for test keys) or `"live"` (for real payments).
   - Supply `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env` or Vercel environment variables.
3. **Deploy Serverless Functions**:
   - The pre-built Vercel serverless endpoints in `/api` (`create-order.js`, `verify-payment.js`, `create-booking.js`) are ready to deploy.

---

## 📁 File Structure

```text
AURELIA-CAFE/
├── api/                           # Vercel Serverless Functions (Secrets never in client)
│   ├── _firebaseAdmin.js          # Serverless Firebase Admin SDK initialization
│   ├── _security.js               # CORS, rate limiting, honeypot & HMAC signature verifier
│   ├── create-booking.js          # Atomic table booking with capacity transaction
│   ├── create-order.js            # Server-side price recalculation & Razorpay order creation
│   ├── razorpay-webhook.js        # Idempotent webhook verification (paid/failed/refunded)
│   └── verify-payment.js          # Razorpay signature check & status update
├── public/
│   └── favicon.svg                # Aurelia Cafe SVG coffee cup favicon
├── src/
│   ├── components/
│   │   ├── AdminPortal.jsx        # Protected Owner Admin Dashboard (Orders, Bookings, CSV, Chimes)
│   │   ├── BookingForm.jsx        # Real-time table booking form with capacity checks
│   │   ├── DemoNoticeBanner.jsx   # Prominent "Demo Mode: No Real Payments" banner
│   │   ├── ExperienceSections.jsx # Outdoor view, reviews, map, FAQs, footer
│   │   ├── Header.jsx             # Nav header with live cart count & mobile drawer
│   │   ├── Hero.jsx               # Headline reveal, rising steam, parallax sea, magnetic button
│   │   ├── LegalModal.jsx         # Privacy notice, Terms, Refund policy modals
│   │   ├── LiveMusicSection.jsx   # Live music card with schedule placeholder
│   │   ├── Loader.jsx             # SVG coffee cup filling loader with wave curtain
│   │   ├── MenuSection.jsx        # Tabs, cuisine chips, offline badges for unpriced/alcohol
│   │   ├── OrderConfirmationModal.jsx # Live order status tracker
│   │   ├── OrderDrawer.jsx        # Full Cart Drawer (Dine-in / Takeaway / Pay Online / Pay at Venue)
│   │   ├── StickyMobileCartBar.jsx# Bottom floating mobile cart bar
│   │   ├── TimelineSection.jsx    # Morning-to-night timeline (pinned desktop, swipeable mobile)
│   │   └── UI.jsx                 # Custom cursor, wave dividers, buttons with ripples
│   ├── data/
│   │   ├── menu.js                # Server/client menu dataset (categories, items, prices)
│   │   └── siteConfig.js          # Master config (features, payments, ordering, booking, legal)
│   ├── firebase/
│   │   └── config.js              # Client Firebase Auth & Firestore initialization
│   ├── hooks/
│   │   └── useReducedMotion.js    # Accessibility prefers-reduced-motion hook
│   ├── App.jsx                    # Root app assembling components, cart state, & QR parameters
│   ├── main.jsx                   # React root entry
│   └── styles.css                 # Design tokens, motion classes, responsive & admin styling
├── test/
│   └── order-booking.test.js      # Backend security & verification test suite (7 tests)
├── .env.example                   # Complete template of all required secrets & keys
├── firestore.rules                # Firestore security rules (restricted client writes)
├── vercel.json                    # Vercel deployment & API rewrites configuration
├── vite.config.js                 # Vite bundler & meta token replacer
└── package.json                   # Dependencies: React, Vite, GSAP, Lenis, Firebase, Razorpay
```

---

## ⚡ How to Rebrand for a Client in Under 30 Minutes

To create a branded client version, you only need to edit **two config files**:

### 1. `src/data/siteConfig.js`
- **Features & Modes**:
  ```javascript
  features: { ordering: true, booking: true, admin: true }
  payments: {
    mode: "test", // "off" (inquiry only) | "test" (simulation) | "live" (real money)
    provider: "razorpay",
    currency: "INR",
    allowPayAtVenue: true,
    bookingDepositPerPerson: 0 // set e.g. 100 for ₹100/person refundable deposit
  }
  ordering: {
    types: ["dine-in", "takeaway"],
    excludeCategories: ["alcohol"], // Alcohol excluded from online payment
    minOrder: 0
  }
  ```
- **Brand Info**: Update `brand.name`, `brand.tagline`, `brand.location`, `brand.whatsapp` (e.g. `916369403544`), and `brand.mapsUrl`.
- **Legal Identity**: Fill `legal.businessName`, `legal.gstNumber`, `legal.supportPhone`, and `legal.registeredAddress`.

### 2. `src/data/menu.js`
- Add or modify categories, item names, descriptions, and numeric prices (in INR `₹`).
- Items with `price: null` display as `"Ask us"` and cannot be ordered online.
- Items tagged with `alcoholOnly: true` or `category: "alcohol"` are excluded from online payment.

---

## 💳 Testing with Razorpay Test Keys

1. Sign up for a free [Razorpay](https://razorpay.com/) test account.
2. In the Razorpay Dashboard, toggle the switch in the top bar to **Test Mode**.
3. Navigate to **Settings → API Keys** and click **Generate Test Key**.
4. Copy `Key Id` (starts with `rzp_test_...`) and `Key Secret`.
5. In `.env`:
   ```bash
   VITE_RAZORPAY_KEY_ID="rzp_test_yourKeyHere"
   RAZORPAY_KEY_ID="rzp_test_yourKeyHere"
   RAZORPAY_KEY_SECRET="yourSecretKeyHere"
   RAZORPAY_WEBHOOK_SECRET="yourWebhookSecret"
   ```
6. Open the site in your browser. Add items to cart, select **Pay Online**, and Razorpay Checkout will pop up.
7. Use Razorpay test credentials:
   - **UPI**: Enter `success@razorpay` (or `failure@razorpay` to test payment failure).
   - **Cards**: Use test card `4111 1111 1111 1111`, any future expiry date, CVV `123`, and OTP `123456`.

---

## 🚀 How a Client Goes Live with Their OWN Razorpay Account

When handing over to the business owner to accept real money:

1. **Activate Razorpay Live Mode**:
   - The owner logs in to [Razorpay](https://dashboard.razorpay.com) and completes business KYC verification (GSTIN, bank account, business pan).
   - Switch toggle from **Test Mode** to **Live Mode**.
   - Navigate to **Settings → API Keys** and generate **Live Keys** (`rzp_live_...`).
2. **Update Environment Variables**:
   - In Vercel Project Settings (or production `.env`):
     ```bash
     VITE_RAZORPAY_KEY_ID="rzp_live_..."
     RAZORPAY_KEY_ID="rzp_live_..."
     RAZORPAY_KEY_SECRET="..."
     RAZORPAY_WEBHOOK_SECRET="..."
     ```
3. **Configure Razorpay Webhook**:
   - In Razorpay Dashboard → **Settings → Webhooks**, click **Add New Webhook**.
   - **Webhook URL**: `https://<client-domain>/api/razorpay-webhook`
   - **Secret**: Set the same secret as `RAZORPAY_WEBHOOK_SECRET`.
   - **Active Events**: Check `order.paid`, `payment.captured`, `payment.failed`, and `refund.processed`.
4. **Switch siteConfig to Live**:
   - In `src/data/siteConfig.js`, set `demoMode: false` and `payments.mode: "live"`.
   - The demo banner will automatically disappear and production receipt emails/SMS will be sent.

---

## 🌐 Vercel Serverless Deployment Steps

1. **Install Vercel CLI & Login**:
   ```bash
   npm install -g vercel
   vercel login
   ```
2. **Deploy to Vercel**:
   ```bash
   vercel
   ```
3. **Configure Environment Variables in Vercel**:
   - Go to your Project Dashboard on `vercel.com` → **Settings → Environment Variables**.
   - Add all variables from `.env.example`:
     - `VITE_RAZORPAY_KEY_ID`
     - `RAZORPAY_KEY_ID`
     - `RAZORPAY_KEY_SECRET`
     - `RAZORPAY_WEBHOOK_SECRET`
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_CLIENT_EMAIL`
     - `FIREBASE_PRIVATE_KEY`
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `ALLOWED_ORIGIN` (set to your production domain)
4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## 🛡️ Firestore Security Rules

Deploy the included [`firestore.rules`](file:///d:/MY%20PROJECTS/AURELIA-CAFE/firestore.rules) to Firebase:
```bash
firebase deploy --only firestore:rules
```
- **Customers**: Cannot read or write orders and bookings directly from the browser; all mutations run strictly through serverless `/api` endpoints using the Admin SDK.
- **Owners**: Authenticated administrators can read and update live statuses in the `/admin` portal.

---

## 🧪 Automated Security & Backend Tests

Run the test suite using Node.js native test runner:
```bash
node --test test/order-booking.test.js
```

### Verified Test Cases:
1. **Price Tampering Prevention**: The server ignores manipulated client prices and recalculates subtotal and total from the server menu.
2. **Category Exclusion**: Alcohol items are rejected from online ordering and payments.
3. **Unpriced Items**: Items marked "Ask us" cannot be ordered online.
4. **Double Submissions**: Rapid clicks and concurrent requests produce distinct, validated order transactions.
5. **HMAC Signature Verification**: Invalid payment signatures and tampered receipts are rejected.
6. **Webhook Idempotency**: Duplicate webhook delivery events are safely acknowledged without double processing.
7. **Double Booking Prevention**: Firestore transaction handles slot capacity atomically, rejecting over-capacity requests.

---

## 💻 Running the App Locally

```bash
# Start local development server
npm run dev
```
- Open `http://localhost:3000/` for the main cafe experience.
- Open `http://localhost:3000/?table=5` to simulate a customer scanning a table QR code.
- Open `http://localhost:3000/?admin=true` to access the Owner Admin Dashboard.
