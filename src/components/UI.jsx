import { useEffect, useRef, useState } from 'react'
import { siteConfig } from '../data/siteConfig'

const responsiveSrcSet = (src) => {
  if (!src || !src.includes('w=')) return undefined
  return [600, 900, 1400].map((width) => `${src.replace(/([?&])w=\d+/, `$1w=${width}`)} ${width}w`).join(', ')
}

export function ArrowIcon({ direction = 'right' }) {
  return <span className={`arrow-icon arrow-icon--${direction}`} aria-hidden="true">↗</span>
}

export function BrandMark({ light = false, className = '' }) {
  return (
    <span className={`brand-mark ${light ? 'brand-mark--light' : ''} ${className}`}>
      <span className="brand-mark__seal" aria-hidden="true">
        <span>A</span>
      </span>
      <span className="brand-mark__type">
        <strong>{siteConfig.brand.name}</strong>
        {siteConfig.brand.tagline && <small>{siteConfig.brand.tagline}</small>}
      </span>
    </span>
  )
}

export function Button({ children, href, onClick, variant = 'primary', type = 'button', className = '', target }) {
  const classes = `button button--${variant} ${className}`
  const handleClick = (event) => {
    const btn = event.currentTarget
    const circle = document.createElement('span')
    const diameter = Math.max(btn.clientWidth, btn.clientHeight)
    const radius = diameter / 2
    const rect = btn.getBoundingClientRect()
    circle.style.width = circle.style.height = `${diameter}px`
    circle.style.left = `${event.clientX - rect.left - radius}px`
    circle.style.top = `${event.clientY - rect.top - radius}px`
    circle.classList.add('button-ripple')
    const existing = btn.querySelector('.button-ripple')
    if (existing) existing.remove()
    btn.appendChild(circle)
    window.setTimeout(() => circle.remove(), 650)
    if (onClick) onClick(event)
  }

  if (href) {
    return (
      <a
        className={classes}
        href={href}
        onClick={handleClick}
        target={target}
        rel={target === '_blank' ? 'noreferrer' : undefined}
      >
        <span>{children}</span>
        <ArrowIcon />
      </a>
    )
  }
  return (
    <button className={classes} onClick={handleClick} type={type}>
      <span>{children}</span>
      <ArrowIcon />
    </button>
  )
}

export function WaveDivider({ flip = false, fill = 'currentColor', className = '' }) {
  return (
    <div className={`wave-divider ${flip ? 'wave-divider--flip' : ''} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
        <path
          className="wave-drift"
          fill={fill}
          d="M0,24 C240,48 480,4 720,24 C960,44 1200,8 1440,24 L1440,60 L0,60 Z"
        />
      </svg>
    </div>
  )
}

export function SectionHeading({ eyebrow, title, body, align = 'left', dark = false }) {
  return (
    <div className={`section-heading section-heading--${align} ${dark ? 'section-heading--dark' : ''}`} data-reveal>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {body && <p className="section-heading__body">{body}</p>}
    </div>
  )
}

export function ImageReveal({ image, className = '', eager = false, onClick, cursorView = false }) {
  const sizes = className.includes('hero-media') ? '100vw' : '(max-width: 680px) 100vw, (max-width: 980px) 90vw, 50vw'
  return (
    <figure className={`image-reveal ${className} ${cursorView ? 'cursor-view' : ''}`} data-reveal onClick={onClick}>
      <img
        src={image.src}
        srcSet={responsiveSrcSet(image.src)}
        sizes={sizes}
        width={image.width || 1400}
        height={image.height || 1000}
        alt={image.alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
      {cursorView && <span className="image-reveal__label">View</span>}
    </figure>
  )
}

export { Loader } from './Loader'

export function CustomCursor() {
  const cursorRef = useRef(null)
  const ringRef = useRef(null)
  const labelRef = useRef(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    // Desktop only: check for pointer: fine
    const finePointer = window.matchMedia('(pointer: fine)')
    if (!finePointer.matches) return undefined

    const handleMove = (event) => {
      if (cursorRef.current) cursorRef.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`
      const target = event.target.closest('a, button, .cursor-view, .menu-card')
      const isImage = target?.classList.contains('cursor-view')
      setActive(Boolean(target))
      if (labelRef.current) labelRef.current.textContent = isImage ? 'View' : ''
    }

    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  return (
    <>
      <span ref={cursorRef} className="custom-cursor" aria-hidden="true" />
      <span ref={ringRef} className={`custom-cursor__ring ${active ? 'is-active' : ''}`} aria-hidden="true">
        <span ref={labelRef} />
      </span>
    </>
  )
}

export function Lightbox({ image, onClose }) {
  useEffect(() => {
    if (!image) return undefined
    const handleKey = (event) => event.key === 'Escape' && onClose()
    document.body.classList.add('lightbox-open')
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.classList.remove('lightbox-open')
      window.removeEventListener('keydown', handleKey)
    }
  }, [image, onClose])

  if (!image) return null

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Gallery image" onClick={onClose}>
      <button className="lightbox__close" type="button" onClick={onClose} aria-label="Close image">×</button>
      <img
        src={image.src}
        srcSet={responsiveSrcSet(image.src)}
        sizes="(max-width: 680px) 94vw, 90vw"
        width={image.width || 1400}
        height={image.height || 1000}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        onClick={(event) => event.stopPropagation()}
      />
      <p>{image.caption || image.alt}</p>
    </div>
  )
}

export function WhatsAppIcon() {
  return (
    <svg className="whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.5 3.5A11.8 11.8 0 0 0 12.08 0C5.55 0 .24 5.31.24 11.84c0 2.09.55 4.13 1.6 5.93L.14 24l6.37-1.67a11.82 11.82 0 0 0 5.57 1.42h.01c6.53 0 11.84-5.31 11.84-11.84 0-3.17-1.24-6.15-3.43-8.41ZM12.1 21.78h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.78.99 1.01-3.68-.23-.38a9.9 9.9 0 0 1-1.52-5.28C2.18 6.37 6.63 1.92 12.1 1.92c2.65 0 5.14 1.03 7.01 2.91a9.84 9.84 0 0 1 2.9 7.02c0 5.47-4.45 9.93-9.91 9.93Zm5.44-7.44c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.23-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.8.38-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.09 4.5.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.13-.27-.2-.57-.35Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function WhatsAppFloat() {
  const href = `https://wa.me/${siteConfig.brand.whatsapp}?text=${encodeURIComponent(`Hello ${siteConfig.brand.name}, I would like to enquire about a table.`)}`
  return (
    <a
      className="whatsapp-float"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Aurelia Cafe on WhatsApp"
    >
      <span className="whatsapp-float__label">Chat on WhatsApp</span>
      <span className="whatsapp-float__icon">
        <WhatsAppIcon />
      </span>
    </a>
  )
}
