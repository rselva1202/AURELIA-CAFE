import { ArrowIcon } from './UI'

export default function StickyMobileCartBar({ itemCount, total, onOpen }) {
  if (!itemCount || itemCount <= 0) return null

  return (
    <div className="sticky-mobile-cart-bar">
      <div className="cart-bar-details">
        <span className="cart-bar-badge">{itemCount} items</span>
        <strong className="cart-bar-total">₹{total}</strong>
      </div>
      <button type="button" className="cart-bar-button" onClick={onOpen}>
        <span>View Cart</span>
        <ArrowIcon />
      </button>
    </div>
  )
}
