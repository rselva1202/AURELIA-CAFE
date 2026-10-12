import { siteConfig } from '../data/siteConfig'

export function DemoNoticeBanner() {
  if (!siteConfig.demoMode) return null

  return (
    <div className="demo-banner" role="status" aria-live="polite">
      <div className="page-shell demo-banner__content">
        <span className="demo-banner__pill">DEMO MODE</span>
        <p className="demo-banner__text">
          <strong>Demo mode: no real payments.</strong> Experience online ordering and table booking with simulated checkout and live status tracking.
        </p>
      </div>
    </div>
  )
}
