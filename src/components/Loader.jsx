import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { siteConfig } from '../data/siteConfig'
import useReducedMotion from '../hooks/useReducedMotion'

const SESSION_STORAGE_KEY = 'aurelia_loader_session_seen'

export function Loader({ onComplete }) {
  const isReduced = useReducedMotion()
  const loaderRef = useRef(null)
  const cupLiquidRef = useRef(null)
  const cupSteamRef = useRef(null)
  const curtainRef = useRef(null)
  const curtainEdgeRef = useRef(null)
  const [percent, setPercent] = useState(0)

  const config = siteConfig.loader || {
    brandName: 'Aurelia Cafe',
    tagline: 'Coffee, toasts and sea views · Varkala, Kerala',
    minDuration: 1600,
    maxDuration: 4000,
    quickFadeDuration: 500,
  }

  // SessionStorage check safely inside try/catch
  const isFirstVisitRef = useRef(null)
  if (isFirstVisitRef.current === null) {
    try {
      const seen = window.sessionStorage?.getItem(SESSION_STORAGE_KEY)
      isFirstVisitRef.current = !seen
    } catch {
      isFirstVisitRef.current = true
    }
  }

  useEffect(() => {
    // 1. Reduced motion: immediate soft fade
    if (isReduced) {
      try {
        window.sessionStorage?.setItem(SESSION_STORAGE_KEY, '1')
      } catch {
        // ignore
      }
      const tl = gsap.timeline({ onComplete: () => onComplete?.() })
      tl.to(loaderRef.current, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
      })
      return () => tl.kill()
    }

    // 2. Repeat visit in same session: quick fade
    if (!isFirstVisitRef.current) {
      const tl = gsap.timeline({ onComplete: () => onComplete?.() })
      tl.to(loaderRef.current, {
        opacity: 0,
        duration: (config.quickFadeDuration || 500) / 1000,
        ease: 'power2.out',
      })
      return () => tl.kill()
    }

    // 3. First visit: SVG Coffee cup fills (min 1.6s, max 4s), steam rises, wave-edged curtain lifts
    try {
      window.sessionStorage?.setItem(SESSION_STORAGE_KEY, '1')
    } catch {
      // ignore
    }

    const minDur = (config.minDuration || 1600) / 1000
    const fillDur = Math.max(1.6, minDur)

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => onComplete?.(),
      })

      // Counter & Liquid fill
      const counterObj = { val: 0 }
      tl.to(counterObj, {
        val: 100,
        duration: fillDur,
        ease: 'power1.inOut',
        onUpdate: () => setPercent(Math.round(counterObj.val)),
      }, 0)

      // Animate liquid rising inside coffee cup (y goes from 90 to 25)
      if (cupLiquidRef.current) {
        tl.fromTo(
          cupLiquidRef.current,
          { attr: { y: 95, height: 0 } },
          { attr: { y: 28, height: 67 }, duration: fillDur, ease: 'power1.inOut' },
          0
        )
      }

      // Rising steam animation
      if (cupSteamRef.current) {
        const steamPaths = cupSteamRef.current.querySelectorAll('.steam-line')
        tl.fromTo(
          steamPaths,
          { opacity: 0, y: 15, scaleY: 0.6 },
          {
            opacity: 0.85,
            y: -10,
            scaleY: 1.1,
            duration: 0.9,
            stagger: 0.15,
            ease: 'sine.out',
          },
          fillDur * 0.45
        )
      }

      // Small pause to admire the steam & brand mark
      tl.to({}, { duration: 0.3 })

      // Wave-edged curtain lifts to reveal hero (translateY -100%)
      if (curtainRef.current) {
        tl.to(curtainRef.current, {
          yPercent: -100,
          duration: 1.05,
          ease: 'power3.inOut',
        })
      }
    })

    return () => ctx.revert()
  }, [isReduced, config.minDuration, config.quickFadeDuration, onComplete])

  return (
    <aside
      ref={loaderRef}
      className="aurelia-loader"
      aria-label="Loading Aurelia Cafe experience"
      aria-live="polite"
    >
      <div ref={curtainRef} className="aurelia-loader__curtain">
        <div className="aurelia-loader__content">
          {/* Animated SVG Coffee Cup */}
          <div className="aurelia-loader__cup-box">
            <svg
              className="aurelia-loader__svg"
              viewBox="0 0 160 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                {/* Clip path inside the cup bowl */}
                <clipPath id="coffee-cup-clip">
                  <path d="M30 30 C30 30, 32 90, 80 90 C128 90, 130 30, 130 30 Z" />
                </clipPath>
                {/* Espresso liquid gradient */}
                <linearGradient id="espresso-fill-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--coral, #E9774B)" />
                  <stop offset="35%" stopColor="#8A4A28" />
                  <stop offset="100%" stopColor="var(--espresso, #2B1B14)" />
                </linearGradient>
              </defs>

              {/* Steam waves */}
              <g ref={cupSteamRef} className="aurelia-loader__steam">
                <path
                  className="steam-line steam-line-1"
                  d="M60 22 C55 14, 65 8, 60 0"
                  stroke="var(--cream, #F6EBDD)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0"
                />
                <path
                  className="steam-line steam-line-2"
                  d="M80 20 C75 11, 85 6, 80 -4"
                  stroke="var(--coral, #E9774B)"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  opacity="0"
                />
                <path
                  className="steam-line steam-line-3"
                  d="M100 22 C95 14, 105 8, 100 0"
                  stroke="var(--cream, #F6EBDD)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0"
                />
              </g>

              {/* Cup handle */}
              <path
                d="M125 40 C145 40, 145 75, 122 75"
                stroke="var(--cream, #F6EBDD)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Cup Saucer */}
              <path
                d="M18 106 C18 102, 142 102, 142 106 C142 110, 18 110, 18 106 Z"
                fill="var(--cream, #F6EBDD)"
                opacity="0.85"
              />

              {/* Liquid fill clipped inside cup body */}
              <g clipPath="url(#coffee-cup-clip)">
                <rect
                  ref={cupLiquidRef}
                  x="20"
                  y="95"
                  width="120"
                  height="0"
                  fill="url(#espresso-fill-grad)"
                />
                {/* Surface ripple line */}
                <ellipse cx="80" cy="30" rx="48" ry="4" fill="rgba(246, 235, 221, 0.2)" />
              </g>

              {/* Cup outer outline */}
              <path
                d="M30 30 C30 30, 32 90, 80 90 C128 90, 130 30, 130 30 Z"
                stroke="var(--cream, #F6EBDD)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>

          <div className="aurelia-loader__meta">
            <h2 className="aurelia-loader__title">{config.brandName}</h2>
            <p className="aurelia-loader__tagline">{config.tagline}</p>
            <div className="aurelia-loader__bar-wrap">
              <div
                className="aurelia-loader__bar"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="aurelia-loader__percent">{percent}%</span>
          </div>
        </div>

        {/* Wave-edged bottom border on the curtain */}
        <div ref={curtainEdgeRef} className="aurelia-loader__wave-bottom" aria-hidden="true">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path
              d="M0,0 L1440,0 L1440,35 C1200,70, 960,10, 720,45 C480,80, 240,15, 0,45 Z"
              fill="var(--espresso, #2B1B14)"
            />
          </svg>
        </div>
      </div>
    </aside>
  )
}
