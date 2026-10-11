import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { siteConfig } from '../data/siteConfig'
import { SectionHeading } from './UI'
import useReducedMotion from '../hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

export default function TimelineSection() {
  const isReduced = useReducedMotion()
  const timelineRef = useRef(null)
  const trackRef = useRef(null)
  const items = siteConfig.timeline || []

  useEffect(() => {
    if (isReduced) return undefined

    const track = trackRef.current
    const section = timelineRef.current
    if (!track || !section) return undefined

    // Only pin on desktop (min-width: 992px)
    const mm = gsap.matchMedia()

    mm.add('(min-width: 992px)', () => {
      const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth + 120)
      const tween = gsap.to(track, {
        x: () => -getDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${getDistance()}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      return () => {
        tween.kill()
      }
    })

    return () => mm.revert()
  }, [isReduced])

  return (
    <section className="timeline-section section-cream" id="timeline" ref={timelineRef} aria-labelledby="timeline-title">
      <div className="page-shell timeline-intro">
        <SectionHeading
          eyebrow="Rhythms of the Cliff"
          title="Morning to night at Aurelia."
          body="From the first quiet morning brew to lantern-lit coastal dinners, follow the flow of our cliffside days."
        />
      </div>

      <div className="timeline-pin-container">
        <div className="timeline-track" ref={trackRef}>
          {items.map((step, idx) => (
            <article className="timeline-card" key={step.id}>
              <div className="timeline-card__media">
                <img
                  src={step.image}
                  alt={step.headline}
                  loading="lazy"
                  decoding="async"
                  width="1200"
                  height="800"
                />
                <div className="timeline-card__overlay" />
                <span className="timeline-card__accent-tag">{step.accent}</span>
              </div>
              <div className="timeline-card__body">
                <div className="timeline-card__header">
                  <span className="timeline-card__icon" aria-hidden="true">{step.icon}</span>
                  <span className="timeline-card__step-num">0{idx + 1}</span>
                </div>
                <h3 className="timeline-card__label">{step.label}</h3>
                <h4 className="timeline-card__headline">{step.headline}</h4>
                <p className="timeline-card__desc">{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="timeline-swipe-hint page-shell">
        <span>← Swipe to explore timeline →</span>
      </div>
    </section>
  )
}
