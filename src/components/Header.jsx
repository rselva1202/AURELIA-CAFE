import { useEffect, useState } from 'react'
import { navigation, siteConfig } from '../data/siteConfig'
import { BrandMark, Button } from './UI'

export default function Header({ menuOpen, onMenuToggle, onOpenDrawer, orderCount = 0 }) {
  const [hidden, setHidden] = useState(false)
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    let lastScroll = window.scrollY
    const onScroll = () => {
      const current = window.scrollY
      setSolid(current > window.innerHeight * 0.72)
      setHidden(current > lastScroll && current > 90)
      lastScroll = current
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && menuOpen) onMenuToggle(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen, onMenuToggle])

  const closeMenu = () => onMenuToggle(false)

  return (
    <>
      <header
        className={`site-header ${hidden && !menuOpen ? 'site-header--hidden' : ''} ${
          solid ? 'site-header--solid' : ''
        } ${menuOpen ? 'site-header--menu-open' : ''}`}
      >
        <a className="site-header__logo" href="#top" aria-label={`${siteConfig.brand.name} home`}>
          <BrandMark light={!solid && !menuOpen} />
        </a>

        <nav className="site-header__nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-header__actions">
          {orderCount > 0 && (
            <button
              type="button"
              className="header-cart-btn"
              onClick={onOpenDrawer}
              aria-label={`Open order drawer with ${orderCount} items`}
            >
              Order ({orderCount})
            </button>
          )}

          <Button
            href="#booking"
            variant={solid || menuOpen ? 'primary' : 'light'}
            className="site-header__book-btn"
          >
            <span className="header-book-label-full">Book a table</span>
            <span className="header-book-label-short">Book table</span>
          </Button>

          {/* Mobile menu hamburger/close button: always visible and clearly labelled */}
          <button
            className="menu-toggle"
            type="button"
            onClick={() => onMenuToggle(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            <span className="menu-toggle-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <b>{menuOpen ? 'Close' : 'Menu'}</b>
          </button>
        </div>
      </header>

      {/* Full-screen mobile menu that locks scroll and keeps Close button visible */}
      <div
        id="mobile-menu"
        className={`mobile-menu ${menuOpen ? 'is-open' : ''}`}
        aria-hidden={!menuOpen}
        role="dialog"
        aria-label={`${siteConfig.brand.name} mobile menu`}
      >
        <div className="mobile-menu__backdrop" onClick={closeMenu} />
        <div className="mobile-menu__content">
          <div className="mobile-menu__top">
            <p className="eyebrow">{siteConfig.brand.name} · {siteConfig.brand.location}</p>
            <button
              type="button"
              className="mobile-menu__close-btn"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              ✕ Close
            </button>
          </div>

          <nav aria-label="Mobile navigation">
            {navigation.map((item, index) => (
              <a key={item.href} href={item.href} onClick={closeMenu}>
                <span>0{index + 1}</span>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mobile-menu__actions">
            <button
              type="button"
              className="button button--outline mobile-drawer-open"
              onClick={() => {
                closeMenu()
                onOpenDrawer?.()
              }}
            >
              <span>View WhatsApp Order Drawer ({orderCount})</span>
            </button>
            <a
              className="mobile-menu__contact"
              href={siteConfig.brand.phoneHref}
              onClick={closeMenu}
            >
              WhatsApp: {siteConfig.brand.phone}
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
