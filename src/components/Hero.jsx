import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { siteConfig } from '../data/siteConfig'
import { Button } from './UI'
import useReducedMotion from '../hooks/useReducedMotion'

export default function Hero({ onBookTable }) {
  const isReduced = useReducedMotion()
  const magneticBtnRef = useRef(null)
  const heroRef = useRef(null)

  // Magnetic button effect on desktop
  useEffect(() => {
    if (isReduced) return undefined
    const btn = magneticBtnRef.current
    if (!btn) return undefined

    const isFinePointer = window.matchMedia('(pointer: fine)').matches
    if (!isFinePointer) return undefined

    const handleMouseMove = (e) => {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - (rect.left + rect.width / 2)
      const y = e.clientY - (rect.top + rect.height / 2)
      // Soft magnetic pull
      gsap.to(btn, {
        x: x * 0.35,
        y: y * 0.35,
        duration: 0.3,
        ease: 'power2.out',
      })
    }

    const handleMouseLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.4)',
      })
    }

    btn.addEventListener('mousemove', handleMouseMove)
    btn.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      btn.removeEventListener('mousemove', handleMouseMove)
      btn.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isReduced])

  return (
    <section className="hero" id="top" ref={heroRef} aria-labelledby="hero-title">
      {/* Parallax sea layer */}
      <div className="hero__media parallax-sea-layer">
        <img
          src={siteConfig.images.hero.src}
          alt={siteConfig.images.hero.alt}
          className="hero-sea-image"
          width="2000"
          height="1200"
          loading="eager"
          decoding="async"
        />
      </div>

      <div className="hero__shade" />
      <div className="hero__shade-sea" aria-hidden="true" />

      {/* Decorative Rising Steam in Hero background */}
      {!isReduced && (
        <div className="hero__steam-container" aria-hidden="true">
          <svg className="hero__steam-svg" viewBox="0 0 100 120">
            <path className="hero-steam-path hero-steam-1" d="M30,100 Q20,60 35,30 T25,0" />
            <path className="hero-steam-path hero-steam-2" d="M50,110 Q65,70 45,40 T55,0" />
            <path className="hero-steam-path hero-steam-3" d="M70,105 Q55,65 75,35 T65,0" />
          </svg>
        </div>
      )}

      <div className="hero__content page-shell">
        <div className="hero__eyebrow" aria-hidden="true">
          <span className="hero__line" />
          <span className="hero__location-badge">{siteConfig.brand.location}</span>
        </div>

        {/* Line-by-line headline reveal */}
        <h1 id="hero-title">
          {siteConfig.brand.taglineLines.map((line, index) => (
            <span
              className={`hero-copy-line ${index === 1 ? 'hero-copy-line--indent' : ''}`}
              key={line}
            >
              {line}
            </span>
          ))}
        </h1>

        <p className="hero__subline">
          {siteConfig.brand.heroHeadline}
          <br />
          <span className="hero__subline-details">
            {siteConfig.brand.heroSubline}
          </span>
        </p>

        <div className="hero__actions">
          {/* Magnetic main button */}
          <div ref={magneticBtnRef} className="magnetic-wrap">
            <Button href="#booking" onClick={onBookTable} variant="primary">
              Book a table
            </Button>
          </div>
          <Button href="#menu" variant="light">
            Sample menu
          </Button>
        </div>

        <div className="hero__badges" data-reveal>
          <span className="hero__pill">☕ Specialty Coffee</span>
          <span className="hero__pill">🍞 Sourdough Toasts</span>
          <span className="hero__pill">🌊 Sea View Perch</span>
          <span className="hero__pill">🌅 Varkala Cliff</span>
        </div>
      </div>

      <div className="hero__scroll">
        <span>Scroll to explore</span>
        <i />
      </div>
    </section>
  )
}
