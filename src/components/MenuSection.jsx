import { useMemo, useRef, useState, useEffect } from 'react'
import { menuData } from '../data/menu'
import { siteConfig } from '../data/siteConfig'
import { SectionHeading } from './UI'

export default function MenuSection({ onOpenDrawer, orderItems, onAddToCart }) {
  const [activeTab, setActiveTab] = useState(menuData.categories[0]?.id || 'breakfast-toasts')
  const [activeCuisine, setActiveCuisine] = useState(null)
  const tabListRef = useRef(null)
  const indicatorRef = useRef(null)

  const excludedCategories = siteConfig.ordering?.excludeCategories || ['alcohol']

  // Sliding indicator for tabs
  useEffect(() => {
    if (!tabListRef.current || !indicatorRef.current) return
    const activeBtn = tabListRef.current.querySelector(`button[data-id="${activeTab}"]`)
    if (activeBtn) {
      indicatorRef.current.style.width = `${activeBtn.offsetWidth}px`
      indicatorRef.current.style.transform = `translateX(${activeBtn.offsetLeft}px)`
    }
  }, [activeTab])

  // Visible items based on category and servesAlcohol config
  const currentCategory = useMemo(() => {
    return menuData.categories.find((c) => c.id === activeTab) || menuData.categories[0]
  }, [activeTab])

  const visibleItems = useMemo(() => {
    return (currentCategory?.items || []).filter((item) => {
      if (item.alcoholOnly && !menuData.servesAlcohol) {
        return false
      }
      return true
    })
  }, [currentCategory])

  // Count items in cart
  const cartCount = orderItems.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <section className="menu-section section-sand" id="menu" aria-labelledby="menu-title">
      <div className="page-shell">
        <div className="menu-header">
          <SectionHeading
            eyebrow={siteConfig.demoMode ? 'Sample menu · Varkala, Kerala' : 'Our Menu · Varkala, Kerala'}
            title={siteConfig.demoMode ? 'Sample menu.' : 'The Cafe Menu.'}
            body="Golden sourdough toasts, fresh morning coffee, coastal popular plates, and chilled seaside refreshments."
          />
        </div>

        {/* Animated Cuisine Chips */}
        <div className="cuisine-chips-wrap" aria-label="Cuisine varieties">
          <span className="cuisine-chips-label">Kitchen Influences:</span>
          <div className="cuisine-chips">
            {menuData.cuisines.map((c) => (
              <button
                key={c}
                type="button"
                className={`cuisine-chip ${activeCuisine === c ? 'is-active' : ''}`}
                onClick={() => setActiveCuisine(activeCuisine === c ? null : c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs with sliding indicator */}
        <div className="menu-tabs-wrapper">
          <div className="menu-tabs" ref={tabListRef} role="tablist" aria-label="Menu categories">
            <span ref={indicatorRef} className="menu-tab-indicator" aria-hidden="true" />
            {menuData.categories.map((cat) => (
              <button
                key={cat.id}
                data-id={cat.id}
                role="tab"
                type="button"
                aria-selected={activeTab === cat.id}
                className={`menu-tab ${activeTab === cat.id ? 'is-active' : ''}`}
                onClick={() => setActiveTab(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Floating / Sticky Order drawer trigger button */}
          <button
            type="button"
            className="menu-drawer-trigger"
            onClick={onOpenDrawer}
            aria-label="Open Cart & Online Ordering Drawer"
          >
            <span>Cart & Online Order</span>
            {cartCount > 0 && <span className="drawer-badge">{cartCount}</span>}
          </button>
        </div>

        {/* Category Description */}
        {currentCategory?.description && (
          <p className="category-description">{currentCategory.description}</p>
        )}

        {/* Menu items grid */}
        <div className="menu-grid" key={activeTab}>
          {visibleItems.map((item, index) => {
            const hasNumericPrice = typeof item.price === 'number'
            const isExcluded = excludedCategories.includes(item.category) || item.alcoholOnly
            const canOrderOnline = hasNumericPrice && !isExcluded
            const inCart = orderItems.find((o) => o.id === item.id)

            return (
              <article
                className={`menu-card ${!canOrderOnline ? 'menu-card--offline-only' : ''}`}
                key={item.id}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="menu-card__header">
                  <div className="menu-card__title-row">
                    <h3 className="menu-card__name">{item.name}</h3>
                  </div>

                  <div className="menu-card__price-tag">
                    {hasNumericPrice ? (
                      <span className="price-num">₹{item.price}</span>
                    ) : (
                      <span className="price-ask">Ask us</span>
                    )}
                  </div>
                </div>

                <div className="menu-card__footer">
                  <span className="menu-card__category-tag">
                    {isExcluded
                      ? 'Dine-In Only (Excluded from Online Order)'
                      : !hasNumericPrice
                      ? 'Daily Fresh Catch (In-Person / WhatsApp)'
                      : currentCategory.name}
                  </span>

                  {/* "+" Button to add item to Order Drawer */}
                  {canOrderOnline ? (
                    <button
                      type="button"
                      className={`menu-card__add-btn ${inCart ? 'is-added' : ''}`}
                      onClick={() => onAddToCart(item)}
                      aria-label={`Add ${item.name} to online order`}
                    >
                      <span className="plus-symbol">+</span>
                      <span className="add-text">{inCart ? `Added (${inCart.quantity})` : 'Add'}</span>
                    </button>
                  ) : (
                    <span className="menu-card__offline-badge" title="Items without set prices or alcohol cannot be ordered online">
                      {hasNumericPrice ? 'At Venue' : 'Ask Staff'}
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        <div className="menu-bottom-bar">
          <p className="menu-demo-note">
            {siteConfig.demoMode
              ? 'Demo notice: Prices in INR (₹). Items without fixed price show "Ask us" and cannot be purchased online.'
              : 'All dishes prepared fresh to order with locally sourced ingredients.'}
          </p>

          <button
            type="button"
            className="button button--primary"
            onClick={onOpenDrawer}
          >
            <span>View Cart ({cartCount})</span>
          </button>
        </div>
      </div>
    </section>
  )
}
