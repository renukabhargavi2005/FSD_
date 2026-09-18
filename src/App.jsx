import React, { useState, useEffect } from 'react';
import { ShoppingBag, Moon, Sun, Monitor, ShieldCheck, ShoppingCart } from 'lucide-react';
import Storefront from './components/Storefront';
import ProductDetail from './components/ProductDetail';
import CartDrawer from './components/CartDrawer';
import Checkout from './components/Checkout';
import OrderHistory from './components/OrderHistory';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [view, setView] = useState('storefront'); // storefront, product-detail, checkout, orders, admin
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Load Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  // Fetch populated cart from Server
  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleAddToCart = async (productId, quantity = 1) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
      });
      if (response.ok) {
        await fetchCart();
        setCartOpen(true); // Open drawer on addition
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to add item to cart.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCartQty = async (productId, quantity) => {
    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      });
      if (response.ok) {
        fetchCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveCartItem = async (productId) => {
    try {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckoutSuccess = () => {
    setCartItems([]); // Clear local cart
    fetchCart(); // Refresh DB states
  };

  // Count total badge count
  const cartBadgeCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Background decoration elements */}
      <div className="grid-bg-overlay" />
      <div className="blob-bg blob-purple" />
      <div className="blob-bg blob-cyan" />

      {/* Main Navigation Header */}
      <header className="nav-header">
        <div className="container nav-container">
          <div 
            className="logo" 
            style={{ cursor: 'pointer' }}
            onClick={() => setView('storefront')}
          >
            <div className="logo-icon">
              <ShoppingBag size={22} style={{ color: 'white' }} />
            </div>
            <span>Neon<strong className="text-gradient">Shop</strong></span>
          </div>

          <nav className="nav-links">
            <button 
              onClick={() => setView('storefront')} 
              className={`nav-link ${view === 'storefront' || view === 'product-detail' ? 'active' : ''}`}
            >
              Shop Catalog
            </button>
            <button 
              onClick={() => setView('orders')} 
              className={`nav-link ${view === 'orders' ? 'active' : ''}`}
            >
              My Purchases
            </button>
            <button 
              onClick={() => setView('admin')} 
              className={`nav-link ${view === 'admin' ? 'active' : ''}`}
            >
              Seller Panel
            </button>
          </nav>

          <div className="nav-actions">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="btn-icon-only" 
              style={{ borderRadius: '50%', width: '46px', height: '46px' }}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Shopping Cart Trigger */}
            <button 
              className="cart-icon-btn" 
              onClick={() => setCartOpen(true)}
              title="Open Shopping Cart"
            >
              <ShoppingCart size={20} />
              {cartBadgeCount > 0 && (
                <span className="cart-badge">{cartBadgeCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Application Container */}
      <main className="container" style={{ minHeight: 'calc(100vh - 160px)', position: 'relative', zIndex: 10 }}>
        {view === 'storefront' && (
          <Storefront 
            onSelectProduct={(id) => {
              setSelectedProductId(id);
              setView('product-detail');
            }} 
            onAddToCart={handleAddToCart}
          />
        )}

        {view === 'product-detail' && (
          <ProductDetail 
            productId={selectedProductId}
            onAddToCart={handleAddToCart}
            onBack={() => setView('storefront')}
          />
        )}

        {view === 'checkout' && (
          <Checkout 
            cartItems={cartItems}
            onCheckoutSuccess={handleCheckoutSuccess}
            onBackToCatalog={() => setView('storefront')}
          />
        )}

        {view === 'orders' && (
          <OrderHistory 
            onBackToCatalog={() => setView('storefront')}
          />
        )}

        {view === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Slide-out Cart Drawer overlay */}
      <CartDrawer 
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onCheckoutClick={() => setView('checkout')}
      />

      {/* Main Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '32px 0', marginTop: '48px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>© 2026 NeonShop Inc. Crafted with visual excellence.</div>
          <div style={{ display: 'flex', gap: '20px', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={16} /> Secure Checkout</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Monitor size={16} /> Integrated Backend API</span>
          </div>
        </div>
      </footer>
    </>
  );
}
