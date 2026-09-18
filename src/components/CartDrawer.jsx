import React from 'react';
import { X, Trash2, ShoppingBag } from 'lucide-react';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cartItems = [], 
  onUpdateQty, 
  onRemoveItem, 
  onCheckoutClick 
}) {
  
  // Calculate Totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal > 100 || subtotal === 0 ? 0.00 : 5.99;
  const total = subtotal + tax + shipping;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`cart-backdrop ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={22} className="text-gradient-purple" />
            <h3 style={{ fontFamily: 'var(--font-heading)' }}>Shopping Cart</h3>
            <span className="badge badge-purple">{cartItems.length}</span>
          </div>
          <button onClick={onClose} className="btn-icon-only" style={{ borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Items List */}
        <div className="cart-items-list">
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', height: '100%' }}>
              <ShoppingBag size={48} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <div>
                <h4 style={{ color: 'var(--text-heading)', marginBottom: '4px' }}>Your cart is empty</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fill it with neon pulses and artisan designs!</p>
              </div>
              <button onClick={onClose} className="btn btn-primary btn-sm" style={{ marginTop: '10px' }}>
                Start Shopping
              </button>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.productId} className="cart-item fade-in">
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <h4 className="cart-item-name">{item.name}</h4>
                  <div className="cart-item-price">${item.price.toFixed(2)}</div>
                  
                  <div className="cart-item-controls">
                    {/* Quantity selectors */}
                    <div className="qty-selector" style={{ transform: 'scale(0.9)', origin: 'left center' }}>
                      <button 
                        onClick={() => onUpdateQty(item.productId, item.quantity - 1)} 
                        className="qty-btn"
                        disabled={item.quantity <= 1}
                      >-</button>
                      <span className="qty-value">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQty(item.productId, item.quantity + 1)} 
                        className="qty-btn"
                        disabled={item.quantity >= item.stock}
                      >-</button>
                    </div>

                    {/* Delete button */}
                    <button 
                      onClick={() => onRemoveItem(item.productId)}
                      style={{ color: 'var(--danger)', opacity: 0.7, padding: '4px' }}
                      title="Remove Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-totals">
              <div className="cart-total-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-total-row">
                <span>Estimated Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="cart-total-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
              </div>
              {shipping > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', textAlign: 'right', marginTop: '-4px' }}>
                  Add ${(100 - subtotal).toFixed(2)} more for FREE shipping!
                </div>
              )}
              <div className="cart-total-row grand-total">
                <span>Total</span>
                <span className="text-gradient-purple">${total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={() => {
                onCheckoutClick();
                onClose();
              }} 
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
