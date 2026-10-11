import { siteConfig } from '../data/siteConfig'
import { ArrowIcon, Button } from './UI'

export default function LiveMusicSection({ onReserve }) {
  const cfg = siteConfig.liveMusic

  if (!cfg || !cfg.enabled) {
    return null
  }

  return (
    <section className="live-music-section section-ink" id="live-music" aria-labelledby="live-music-title">
      <div className="page-shell">
        <div className="live-music-card" data-reveal>
          <div className="live-music-card__content">
            <span className="live-music-card__badge">{cfg.badge || 'Live Music'}</span>
            <h2 id="live-music-title" className="live-music-card__title">
              {cfg.title}
            </h2>
            <p className="live-music-card__desc">
              {cfg.description}
            </p>

            <div className="live-music-card__schedule">
              <span className="schedule-icon" aria-hidden="true">♪</span>
              <div>
                <strong>Schedule:</strong>
                <span> {cfg.schedulePlaceholder || 'Schedule to be confirmed'}</span>
              </div>
            </div>

            <p className="live-music-card__note">
              {cfg.note}
            </p>

            <div className="live-music-card__actions">
              <Button
                variant="primary"
                onClick={() => onReserve?.({ occasion: 'Live Music & Sunset' })}
              >
                <span>Enquire on WhatsApp</span>
              </Button>
            </div>
          </div>

          <div className="live-music-card__visual" aria-hidden="true">
            <div className="soundwave-bars">
              <span style={{ animationDelay: '0.1s' }} />
              <span style={{ animationDelay: '0.3s' }} />
              <span style={{ animationDelay: '0.5s' }} />
              <span style={{ animationDelay: '0.2s' }} />
              <span style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
