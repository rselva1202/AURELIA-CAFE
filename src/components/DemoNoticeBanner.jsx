import { siteConfig } from '../data/siteConfig'

export function DemoNoticeBanner() {
  const isLive = siteConfig.payments?.mode === 'live'

  if (isLive) return null

  return (
    <div className="demo-banner" role="status" aria-live="polite">
      <div className="page-shell demo-banner__content">
        <span className="demo-banner__pill">DEMO / TEST MODE</span>
        <p className="demo-banner__text">
          <strong>Demo mode: no real payments.</strong> Online ordering and bookings are active in simulation mode using Razorpay Test keys.
        </p>
      </div>
    </div>
  )
}
