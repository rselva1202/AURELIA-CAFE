import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { siteConfig } from './data/siteConfig'
import useReducedMotion from './hooks/useReducedMotion'
import Header from './components/Header'
import Hero from './components/Hero'
import TimelineSection from './components/TimelineSection'
import MenuSection from './components/MenuSection'
import LiveMusicSection from './components/LiveMusicSection'
import OrderDrawer from './components/OrderDrawer'
import OrderConfirmationModal from './components/OrderConfirmationModal'
import BookingConfirmationModal from './components/BookingConfirmationModal'
import StickyMobileCartBar from './components/StickyMobileCartBar'
import LegalModal from './components/LegalModal'
import DemoAdminPortal from './components/DemoAdminPortal'
import { DemoNoticeBanner } from './components/DemoNoticeBanner'
import {
  OutdoorViewSection,
  ReviewsSection,
  LocationSection,
  FaqSection,
  BookingSection,
  FooterSection,
} from './components/ExperienceSections'
import { CustomCursor, Lightbox, Loader, WaveDivider, WhatsAppFloat } from './components/UI'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const reducedMotion = useReducedMotion()
  const lenisRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [reservationIntent, setReservationIntent] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [legalModalType, setLegalModalType] = useState(null)
  const [adminView, setAdminView] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState(null)
  const [confirmedBookingData, setConfirmedBookingData] = useState(null) // { booking, whatsappUrl }
  const [tableParam, setTableParam] = useState(null)

  // Read ?table=5 and ?admin-demo from URL on load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const tbl = params.get('table')
      if (tbl) setTableParam(tbl)

      const isPathAdmin = window.location.pathname.includes('/admin-demo') || window.location.pathname.includes('/admin')
      const isQueryAdmin = params.get('admin') === 'true' || params.has('admin-demo')
      if (isPathAdmin || isQueryAdmin) {
        setAdminView(true)
      }
    } catch {
      // ignore
    }
  }, [])

  // Manage body scroll lock
  useEffect(() => {
    document.body.classList.toggle('loader-locked', loading)
    if (lenisRef.current) {
      if (loading) lenisRef.current.stop()
      else if (!menuOpen && !drawerOpen && !adminView && !legalModalType && !confirmedOrder && !confirmedBookingData) {
        lenisRef.current.start()
      }
    }
    return () => {
      document.body.classList.remove('loader-locked')
    }
  }, [loading, menuOpen, drawerOpen, adminView, legalModalType, confirmedOrder, confirmedBookingData])

  // Scroll animations with GSAP
  useEffect(() => {
    if (loading || adminView) return undefined

    const ctx = gsap.context(() => {
      // General data-reveal elements
      gsap.utils.toArray('[data-reveal]').forEach((element) => {
        gsap.fromTo(
          element,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: { trigger: element, start: 'top 88%', once: true },
          }
        )
      })

      // Hero animations (transforms & opacity only, skipped if prefers-reduced-motion)
      if (!reducedMotion) {
        // Parallax sea image layer
        gsap.to('.hero-sea-image', {
          yPercent: 18,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        })

        // Hero headline line-by-line reveal
        gsap.fromTo(
          '.hero-copy-line',
          { yPercent: 105, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 1.05,
            stagger: 0.14,
            delay: 0.05,
            ease: 'power4.out',
          }
        )
      }

      ScrollTrigger.refresh()
    })

    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [loading, reducedMotion, adminView])

  // Lenis smooth scrolling (disabled if prefers-reduced-motion)
  useEffect(() => {
    if (reducedMotion || adminView) return undefined

    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true })
    lenisRef.current = lenis

    const onScroll = () => {
      ScrollTrigger.update()
    }

    const raf = (time) => lenis.raf(time * 1000)
    lenis.on('scroll', onScroll)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.off('scroll', onScroll)
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [reducedMotion, adminView])

  // Mobile menu scroll lock
  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen)
    if (lenisRef.current) {
      if (menuOpen) lenisRef.current.stop()
      else lenisRef.current.start()
    }
    return () => {
      document.body.classList.remove('menu-open')
      lenisRef.current?.start()
    }
  }, [menuOpen])

  // Cart operations
  const handleAddToCart = (menuItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === menuItem.id)
      if (existing) {
        return prev.map((i) =>
          i.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...menuItem, quantity: 1, itemNotes: '' }]
    })
    setDrawerOpen(true)
  }

  const handleUpdateQty = (itemId, newQty) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((i) => i.id !== itemId))
    } else {
      setCartItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i))
      )
    }
  }

  const handleUpdateItemNotes = (itemId, notes) => {
    setCartItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, itemNotes: notes } : i))
    )
  }

  const handleClearCart = () => {
    setCartItems([])
  }

  const openReservation = (intent = {}) => {
    setReservationIntent(intent)
    window.setTimeout(() => {
      document.querySelector('#booking')?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
      })
    }, 40)
  }

  const handleOrderSuccess = (order) => {
    setConfirmedOrder(order)
  }

  const handleBookingSuccess = (booking, whatsappUrl) => {
    setConfirmedBookingData({ booking, whatsappUrl })
  }

  const totalCartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0)
  const totalCartAmount = cartItems.reduce((acc, it) => {
    return typeof it.price === 'number' ? acc + it.price * it.quantity : acc
  }, 0)

  // DEMO ADMIN VIEW (/admin-demo)
  if (adminView) {
    return (
      <>
        <DemoNoticeBanner />
        <DemoAdminPortal onBackToSite={() => setAdminView(false)} />
        <CustomCursor />
      </>
    )
  }

  return (
    <>
      {loading && <Loader onComplete={() => setLoading(false)} />}

      <DemoNoticeBanner />

      <Header
        menuOpen={menuOpen}
        onMenuToggle={setMenuOpen}
        onOpenDrawer={() => setDrawerOpen(true)}
        orderCount={totalCartCount}
      />

      <main>
        {/* 1. Hero */}
        <Hero onBookTable={() => openReservation({ notes: 'Table preference: front-row sea view' })} />
        <WaveDivider fill="var(--cream)" />

        {/* 2. Morning to Night Timeline (pinned on desktop, swipeable on mobile) */}
        <TimelineSection />
        <WaveDivider fill="var(--sand)" />

        {/* 3. Menu (tabs, cuisine chips, order drawer integration) */}
        <MenuSection
          onOpenDrawer={() => setDrawerOpen(true)}
          orderItems={cartItems}
          onAddToCart={handleAddToCart}
        />
        <WaveDivider fill="var(--espresso)" />

        {/* 4. Live Music Card (toggleable in config) */}
        <LiveMusicSection onReserve={openReservation} />
        <WaveDivider fill="var(--sand)" />

        {/* 5. Outdoor Seating & Sea-view Gallery */}
        <OutdoorViewSection onReserveTable={openReservation} />
        <WaveDivider fill="var(--sea-teal)" />

        {/* 6. Guest Reviews (3 sample reviews, no invented facts) */}
        <ReviewsSection />
        <WaveDivider fill="var(--sand)" />

        {/* 7. Find Us */}
        <LocationSection />
        <WaveDivider fill="var(--cream)" />

        {/* 8. Table Booking Form */}
        <BookingSection
          reservationIntent={reservationIntent}
          onBookingSuccess={handleBookingSuccess}
        />
        <WaveDivider fill="var(--cream)" />

        {/* 9. FAQ */}
        <FaqSection />
        <WaveDivider fill="var(--espresso)" />
      </main>

      {/* 10. Footer with Legal and Demo Admin triggers */}
      <FooterSection
        onOpenLegal={(type) => setLegalModalType(type)}
        onOpenAdmin={() => setAdminView(true)}
      />

      {/* Sticky Mobile Cart Bar */}
      <StickyMobileCartBar
        itemCount={totalCartCount}
        total={totalCartAmount}
        onOpen={() => setDrawerOpen(true)}
      />

      {/* Order & Payment Cart Drawer */}
      <OrderDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={cartItems}
        onUpdateQty={handleUpdateQty}
        onUpdateItemNotes={handleUpdateItemNotes}
        onClear={handleClearCart}
        onOrderSuccess={handleOrderSuccess}
        defaultTable={tableParam}
      />

      {/* Live Order Confirmation Modal with Timer Advances */}
      {confirmedOrder && (
        <OrderConfirmationModal
          order={confirmedOrder}
          onClose={() => setConfirmedOrder(null)}
        />
      )}

      {/* Table Booking Confirmation Card with WhatsApp summary */}
      {confirmedBookingData && (
        <BookingConfirmationModal
          booking={confirmedBookingData.booking}
          whatsappUrl={confirmedBookingData.whatsappUrl}
          onClose={() => setConfirmedBookingData(null)}
        />
      )}

      {/* Privacy, Terms, & Refund Policy Modal */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      <WhatsAppFloat />
      <Lightbox image={lightbox} onClose={() => setLightbox(null)} />
      <CustomCursor />
      <div className="grain" aria-hidden="true" />
      <div className="sr-only">
        {siteConfig.brand.name} sea-view cafe and kitchen demo in Varkala, Kerala
      </div>
    </>
  )
}
