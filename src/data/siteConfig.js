const resolveBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta?.env?.BASE_URL) {
    return import.meta.env.BASE_URL
  }
  return '/'
}
const withBase = (path) => `${resolveBaseUrl().replace(/\/$/, '')}/${path.replace(/^\//, '')}`

export const siteConfig = {
  // Reusable demo config
  demoMode: true,

  // Feature Toggles (as specified: features: { ordering: true, booking: true })
  features: {
    ordering: true,
    booking: true,
    admin: true,
  },

  // Payment Configuration (as specified: payments: { mode: "demo" })
  payments: {
    mode: 'demo', // Always demo mode
    currency: 'INR',
    allowPayAtVenue: true,
  },

  // Online Ordering Configuration
  ordering: {
    types: ['dine-in', 'takeaway'],
    excludeCategories: ['alcohol'], // Categories/tags not allowed for online ordering/payment
    minOrder: 0,
    notesEnabled: true,
  },

  // Legal & Business Identity Info
  legal: {
    businessName: 'Aurelia Cafe (Demo business)',
    gstNumber: 'GSTIN: to be added by owner',
    supportPhone: '+91 63694 03544',
    supportEmail: 'hello@aureliacafe.com',
    registeredAddress: 'Cliff Perch, North Cliff, Varkala, Kerala',
  },

  brand: {
    name: 'Aurelia Cafe',
    shortName: 'Aurelia Cafe',
    tagline: 'Coffee, toasts and sea views.',
    taglineLines: ['Coffee, toasts', 'and sea views.'],
    heroHeadline: 'Artisan coffee, golden toasts & panoramic sea views over Varkala cliff.',
    heroSubline: 'Perched along the cliffs of Varkala, Kerala. Where morning espresso meets Arabian Sea breezes, and unhurried days flow into golden hour sunsets.',
    location: 'Varkala, Kerala',
    city: 'Varkala, Kerala',
    cityName: 'Varkala',
    state: 'Kerala',
    address: 'Cliff Perch, North Cliff, Varkala, Kerala (Address to be confirmed)',
    addressPlaceholder: 'Address to be confirmed',
    hoursPlaceholder: 'Hours to be confirmed',
    hours: 'Hours: to be confirmed',
    landmark: 'Overlooking the Arabian Sea, Varkala Cliff',
    waterBodyName: 'Arabian Sea',
    phone: '+91 63694 03544',
    phoneHref: 'https://wa.me/916369403544',
    whatsapp: '916369403544',
    whatsappLabel: '+91 63694 03544',
    email: 'hello@aureliacafe.com',
    mapsUrl: 'https://maps.google.com/?q=Varkala+Cliff+Kerala',
  },

  theme: {
    espressoBrown: '#2B1B14',
    cream: '#F6EBDD',
    seaTeal: '#0B3C49',
    coral: '#E9774B',
    espressoBrownLight: '#3D281E',
    espressoBrownDark: '#1E120D',
    creamLight: '#FCF7F0',
    creamDark: '#EDE0CF',
    seaTealLight: '#125263',
    seaTealDark: '#072831',
    coralLight: '#F0906B',
    coralDark: '#D45F33',
  },

  seo: {
    title: 'Aurelia Cafe | Coffee, toasts and sea views | Varkala, Kerala',
    description: 'Aurelia Cafe is a sea-view cafe and kitchen on the cliff in Varkala, Kerala. Specialty coffee, artisanal toasts, and panoramic Arabian Sea views.',
    ogTitle: 'Aurelia Cafe | Coffee, toasts and sea views | Varkala, Kerala',
    ogDescription: 'Sea-view cafe and kitchen perched on Varkala Cliff. Sip artisanal coffee, enjoy golden sourdough toasts, and watch the ocean horizon.',
    ogImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85',
    themeColor: '#2B1B14',
  },

  loader: {
    brandName: 'Aurelia Cafe',
    tagline: 'Coffee, toasts and sea views · Varkala, Kerala',
    minDuration: 1600,
    maxDuration: 4000,
    quickFadeDuration: 500,
  },

  timeline: [
    {
      id: 'morning-coffee',
      label: 'Morning coffee',
      headline: 'Fresh brews & morning salt air',
      description: 'First rays over the Arabian Sea, quiet clifftop benches, freshly pulled espresso, and warm sourdough toasts as the tide rises.',
      accent: 'Golden dawn',
      icon: '☕',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'brunch',
      label: 'Brunch',
      headline: 'Melty toasts & fruit bowls',
      description: 'Signature cheese toasts, French toasts, mixed fruit muesli with curd and wild honey, paired with fresh seasonal fruit juices.',
      accent: 'Mid-morning glow',
      icon: '🥑',
      image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'afternoon',
      label: 'Afternoon',
      headline: 'Slow reads & ocean breeze',
      description: 'A shaded perch under the coastal palms, iced cold brews, cheese naan, and the calming rhythm of waves breaking below.',
      accent: 'Lazy hours',
      icon: '📖',
      image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'sunset',
      label: 'Sunset',
      headline: 'Crimson skies & golden seas',
      description: 'The golden hour spectacle across Varkala Cliff. Tables fill as the sky turns coral and indigo, bringing chilled drinks and grilled plates.',
      accent: 'Magic hour',
      icon: '🌅',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'evening',
      label: 'Evening',
      headline: 'Lantern glow & coastal kitchen',
      description: 'Warm string lights, acoustic vibes, fresh grilled catch, and ambient conversations under the Kerala night sky.',
      accent: 'Starlit sea',
      icon: '✨',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    },
  ],

  liveMusic: {
    enabled: true,
    title: 'Acoustic Evenings by the Cliff',
    badge: 'Live Music',
    schedulePlaceholder: 'Schedule to be confirmed',
    description: 'Acoustic sessions, soft jazz chords, and soulful coastal rhythms accompany the sunset on select evenings.',
    note: 'Artists and performance dates are announced weekly. Enquire on WhatsApp for upcoming sessions.',
  },

  outdoorSeating: {
    eyebrow: 'Cliffside Perch',
    title: 'Front-row seats to the Arabian Sea.',
    body: 'Perched on the red laterite cliff line of Varkala, our open-air terrace catches uninterrupted sea breezes and offers 180-degree ocean views from dawn till starry night.',
    features: [
      'Unobstructed sunset panoramic views',
      'Open-air sea breeze terrace',
      'Shaded wooden tables & lounge corners',
      'Peaceful cliffside ambience',
    ],
  },

  gallery: [
    {
      id: 'sea-terrace',
      src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=85',
      alt: 'Sea-view outdoor cafe terrace overlooking the ocean in Varkala',
      caption: 'Cliffside outdoor terrace with sea views',
      gradientFallback: 'linear-gradient(135deg, #0B3C49 0%, #2B1B14 100%)',
      width: 1400,
      height: 900,
    },
    {
      id: 'espresso-art',
      src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=85',
      alt: 'Freshly pulled artisan espresso coffee at Aurelia Cafe',
      caption: 'Artisan roasted coffee brewed to order',
      gradientFallback: 'linear-gradient(135deg, #2B1B14 0%, #E9774B 100%)',
      width: 1400,
      height: 900,
    },
    {
      id: 'toasts-spread',
      src: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1400&q=85',
      alt: 'Artisan cheese toast and brunch spread on a cafe table',
      caption: 'Golden toasts, fresh bowls and seasonal sips',
      gradientFallback: 'linear-gradient(135deg, #E9774B 0%, #F6EBDD 100%)',
      width: 1400,
      height: 900,
    },
    {
      id: 'cliff-sunset',
      src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85',
      alt: 'Arabian Sea sunset glowing over Varkala cliff',
      caption: 'Golden hour sunset over the Arabian Sea',
      gradientFallback: 'linear-gradient(135deg, #0B3C49 0%, #E9774B 100%)',
      width: 1400,
      height: 900,
    },
  ],

  reviews: [
    {
      id: 'rev-1',
      quote: 'Sitting with an espresso and warm cheese toast while watching the sea waves crash against the cliff was the highlight of our Varkala stay.',
      author: 'Traveler from Bengaluru',
      tag: 'sample',
    },
    {
      id: 'rev-2',
      quote: 'The unhurried energy, gentle sea breeze, and delicious grilled fish at sunset make this cliffside spot completely unforgettable.',
      author: 'Coastal Explorer',
      tag: 'sample',
    },
    {
      id: 'rev-3',
      quote: 'Pure bliss. Wonderful coffee, great tunes in the background, and panoramic Arabian Sea views. Can spend hours here reading.',
      author: 'Solo Backpacker',
      tag: 'sample',
    },
  ],

  faqs: [
    {
      question: 'Where is Aurelia Cafe located?',
      answer: 'We are perched along the scenic cliff in Varkala, Kerala, offering uninterrupted panoramic views of the Arabian Sea.',
    },
    {
      question: 'Do you take table reservations for sunset?',
      answer: 'Yes! You can reserve your table directly via our website booking form or WhatsApp message. Available slots are checked in real-time.',
    },
    {
      question: 'How does demo online ordering work?',
      answer: 'Browse our menu, add priced items to your cart, and choose Pay Online (demo simulation) or Pay at Venue. For dine-in, scan the table QR code or select dine-in with your table number.',
    },
    {
      question: 'Is there outdoor seating with sea views?',
      answer: 'Yes, our outdoor terrace features shaded and open-air cliffside seating with direct views of the Arabian Sea and sunset.',
    },
  ],

  // Table Booking Parameters (as specified)
  booking: {
    slotMinutes: 30,
    openFrom: '09:00',
    openTo: '22:00',
    capacityPerSlot: 20,
    maxPartySize: 10,
    daysAhead: 14,
    title: 'Reserve a Sea-View Table',
    eyebrow: 'Table Booking',
    description: 'Book your spot for morning coffee, leisurely brunch, or golden hour sunsets overlooking Varkala Cliff.',
    occasions: ['Casual dining', 'Sunset & Golden hour', 'Live music evening', 'Birthday celebration', 'Work & Coffee', 'Other'],
  },

  images: {
    hero: {
      src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85',
      alt: 'Arabian Sea waves and Varkala coastal horizon at sunset',
      width: 2000,
      height: 1200,
    },
  },
}

export const navigation = [
  { label: 'Timeline', href: '#timeline' },
  { label: 'Menu', href: '#menu' },
  { label: 'Live Music', href: '#live-music' },
  { label: 'Outdoor & Views', href: '#outdoor' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Find Us', href: '#location' },
  { label: 'Book Table', href: '#booking' },
  { label: 'FAQ', href: '#faq' },
]
