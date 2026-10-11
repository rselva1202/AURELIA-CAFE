import { useState } from 'react'
import { siteConfig } from '../data/siteConfig'
import BookingForm from './BookingForm'
import { ArrowIcon, Button, ImageReveal, SectionHeading } from './UI'

export function OutdoorViewSection({ onReserveTable }) {
  const cfg = siteConfig.outdoorSeating || {}
  const gallery = siteConfig.gallery || []

  return (
    <section className="outdoor section-sand" id="outdoor" aria-labelledby="outdoor-title">
      <div className="outdoor__grid page-shell">
        <div className="outdoor__copy">
          <SectionHeading
            eyebrow={cfg.eyebrow || 'Cliffside Perch'}
            title={cfg.title || 'Front-row seats to the Arabian Sea.'}
            body={cfg.body}
          />
          <ul className="outdoor__features" data-reveal>
            {(cfg.features || []).map((feat) => (
              <li key={feat}>
                <span className="feature-check" aria-hidden="true">✓</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
          <div className="outdoor__actions">
            <Button href="#booking" onClick={() => onReserveTable?.({ occasion: 'Sunset & Sea View Table' })}>
              Reserve a sea-view table
            </Button>
          </div>
        </div>

        {/* Gallery Image Slots with Gradient Fallbacks */}
        <div className="outdoor__gallery-slots" data-reveal>
          {gallery.map((item) => (
            <figure
              className="gallery-slot-card"
              key={item.id}
              style={{ background: item.gradientFallback }}
            >
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                decoding="async"
                width={item.width || 1400}
                height={item.height || 900}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <figcaption className="gallery-slot-caption">{item.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ReviewsSection() {
  const [active, setActive] = useState(0)
  const reviews = siteConfig.reviews || []
  const total = reviews.length || 1
  const currentReview = reviews[active] || {}

  return (
    <section className="reviews section-ink" id="reviews" aria-labelledby="reviews-title">
      <div className="reviews__inner page-shell">
        <div className="reviews__header">
          <SectionHeading
            eyebrow={siteConfig.demoMode ? 'Guest reviews (sample)' : 'Guest reviews'}
            title="Stories from the cliff."
            dark
          />
          {siteConfig.demoMode && (
            <span className="reviews-sample-badge">Sample reviews</span>
          )}
        </div>

        <div className="review-card" data-reveal>
          <div className="review-card__quote">“</div>
          <blockquote>{currentReview.quote}</blockquote>
          <div className="review-card__meta">
            <span>{currentReview.author}</span>
            <small>Aurelia Cafe Guest · {siteConfig.demoMode ? 'sample review' : 'verified'}</small>
          </div>
          <div className="review-card__controls">
            <button
              type="button"
              aria-label="Previous review"
              onClick={() => setActive((active - 1 + total) % total)}
            >
              ←
            </button>
            <span>0{active + 1} <i>/</i> 0{total}</span>
            <button
              type="button"
              aria-label="Next review"
              onClick={() => setActive((active + 1) % total)}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function LocationSection() {
  const brand = siteConfig.brand

  return (
    <section className="location section-sand" id="location" aria-labelledby="location-title">
      <div className="location__grid page-shell">
        <div className="location__copy">
          <SectionHeading
            eyebrow="Find us"
            title="Perched on Varkala Cliff."
            body="Follow the cliff pathway for sweeping views of the Arabian Sea, cool sea breezes, and the aroma of fresh coffee."
          />
          <div className="location__info-cards">
            <div className="info-card">
              <span className="info-card__label">Address</span>
              <p>{brand.address}</p>
              <small>Landmark: {brand.landmark}</small>
            </div>
            <div className="info-card">
              <span className="info-card__label">Opening Hours</span>
              <p>{brand.hours}</p>
            </div>
            <div className="info-card">
              <span className="info-card__label">Direct WhatsApp</span>
              <p>{brand.phone}</p>
            </div>
          </div>
          <div className="location__actions">
            <Button
              href={brand.mapsUrl}
              target="_blank"
              variant="outline"
            >
              <span>View location on Google Maps</span>
              <ArrowIcon />
            </Button>
          </div>
        </div>

        <div className="location-map-card">
          <div className="location-map-inner">
            <span className="map-sea-icon" aria-hidden="true">🌊</span>
            <h4>{brand.name}</h4>
            <p>{brand.location}</p>
            <span className="map-badge">Cliffside Sea View</span>
            <a
              href={brand.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="map-link-btn"
            >
              Open in Google Maps ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export function FaqSection() {
  const [open, setOpen] = useState(0)
  return (
    <section className="faq section-cream" id="faq" aria-labelledby="faq-title">
      <div className="faq__grid page-shell">
        <SectionHeading
          eyebrow="Helpful Details"
          title="Frequently Asked Questions."
          body="Everything you need to know about dining, ordering, and spending your days at Aurelia Cafe."
        />
        <div className="faq-list">
          {siteConfig.faqs.map((faq, index) => (
            <div className={`faq-item ${open === index ? 'is-open' : ''}`} key={faq.question}>
              <button
                type="button"
                onClick={() => setOpen(open === index ? -1 : index)}
                aria-expanded={open === index}
              >
                <span>0{index + 1}</span>
                <strong>{faq.question}</strong>
                <i>{open === index ? '−' : '+'}</i>
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function BookingSection({ reservationIntent, onBookingSuccess }) {
  const brand = siteConfig.brand
  return (
    <section className="contact section-terracotta" id="booking" aria-labelledby="booking-title">
      <div className="contact__top page-shell">
        <div>
          <p className="eyebrow">Table Booking</p>
          <h2 id="booking-title">An unhurried table<br /><em>overlooking the sea.</em></h2>
        </div>
        <a className="contact__phone" href={brand.phoneHref} target="_blank" rel="noreferrer">
          Chat on WhatsApp
          <span>Direct table enquiry <ArrowIcon /></span>
        </a>
      </div>
      <div className="page-shell">
        <BookingForm
          reservationIntent={reservationIntent}
          onBookingSuccess={onBookingSuccess}
        />
      </div>
      <div className="contact__details page-shell">
        <div>
          <span>Location</span>
          <p>{brand.address}</p>
        </div>
        <div>
          <span>Hours</span>
          <p>{brand.hours}<br />{brand.phone}</p>
        </div>
        <div>
          <span>WhatsApp Enquiries</span>
          <p>WhatsApp: {brand.whatsappLabel}<br />{brand.email}</p>
        </div>
      </div>
    </section>
  )
}

export function FooterSection({ onOpenLegal, onOpenAdmin }) {
  return (
    <footer className="footer section-ink">
      <div className="footer__top page-shell">
        <div className="footer-brand" aria-label={siteConfig.brand.name}>
          <div className="footer-brand__text">
            <span className="footer-brand__name">{siteConfig.brand.name}</span>
            <small>{siteConfig.brand.tagline}</small>
          </div>
        </div>

        <div className="footer__links">
          <div>
            <span>Explore</span>
            <a href="#top">Top</a>
            <a href="#timeline">Timeline</a>
            <a href="#menu">Menu</a>
            <a href="#outdoor">Outdoor & Views</a>
            <a href="#booking">Book Table</a>
          </div>
          <div>
            <span>Legal & Safety</span>
            <button type="button" className="footer-link-btn" onClick={() => onOpenLegal?.('privacy')}>
              Privacy Notice
            </button>
            <button type="button" className="footer-link-btn" onClick={() => onOpenLegal?.('terms')}>
              Terms & Conditions
            </button>
            <button type="button" className="footer-link-btn" onClick={() => onOpenLegal?.('refund')}>
              Refund & Cancellation
            </button>
            {siteConfig.features?.admin && (
              <button type="button" className="footer-link-btn admin-link-accent" onClick={onOpenAdmin}>
                🔐 Admin Portal
              </button>
            )}
          </div>
          <div>
            <span>Connect</span>
            <a href={siteConfig.brand.phoneHref} target="_blank" rel="noreferrer">
              WhatsApp Booking
            </a>
            <a href={siteConfig.brand.mapsUrl} target="_blank" rel="noreferrer">
              Google Maps
            </a>
          </div>
        </div>
      </div>

      <div className="footer__bottom page-shell">
        <span>© {new Date().getFullYear()} {siteConfig.brand.name} · {siteConfig.brand.location}</span>
        {siteConfig.demoMode ? (
          <span className="demo-credit">Sample website by Selva R, Tirunelveli</span>
        ) : (
          <span>All rights reserved.</span>
        )}
      </div>
    </footer>
  )
}
