import React, { useState, useEffect, useRef } from 'react';
import { Search, Star, ShoppingBag, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const HERO_SLIDES = [
  {
    id: 1,
    title: "Vibrant Tech, Elevated Sound.",
    desc: "Unleash high-fidelity acoustics with our premium ANC headphones and RGB mechanical gear.",
    btnText: "Shop Tech",
    category: "Tech",
    bg: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    title: "Handcrafted Living Essentials.",
    desc: "Bring warmth and unique textures into your home with artisan ceramics and candles.",
    btnText: "Explore Home",
    category: "Home",
    bg: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1200&auto=format&fit=crop&q=80"
  },
  {
    id: 3,
    title: "Sustainably Sourced Wellness.",
    desc: "Reinvigorate your daily routines with clean botanicals and natural cork yoga gear.",
    btnText: "View Wellness",
    category: "Wellness",
    bg: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=1200&auto=format&fit=crop&q=80"
  }
];

export default function Storefront({ onSelectProduct, onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [category, setCategory] = useState('All');
  const [slideIndex, setSlideIndex] = useState(0);
  const [addingToCartId, setAddingToCartId] = useState(null);
  
  const searchRef = useRef(null);

  // Fetch products based on search and category
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (category && category !== 'All') query.append('category', category);
        if (search) query.append('search', search);

        const response = await fetch(`/api/products?${query.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search slightly
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [category, search]);

  // Handle Autocomplete Suggestions
  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`/api/products?search=${search}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.slice(0, 5)); // cap at 5
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSuggestions();
  }, [search]);

  // Click outside listener for search suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Slide Rotation Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = async (e, productId) => {
    e.stopPropagation();
    setAddingToCartId(productId);
    await onAddToCart(productId, 1);
    // Visual feedback delay
    setTimeout(() => {
      setAddingToCartId(null);
    }, 800);
  };

  const categoriesList = ['All', 'Tech', 'Apparel', 'Home', 'Wellness'];

  return (
    <div className="fade-in">
      {/* Hero Carousel */}
      <section className="hero-slider">
        {HERO_SLIDES.map((slide, idx) => (
          <div 
            key={slide.id} 
            className={`hero-slide ${idx === slideIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${slide.bg})` }}
          >
            <div className="hero-overlay" />
            <div className="hero-content">
              <span className="badge badge-purple" style={{ width: 'fit-content' }}>Featured Collection</span>
              <h2 className="hero-title">{slide.title}</h2>
              <p className="hero-desc">{slide.desc}</p>
              <div className="hero-actions">
                <button 
                  onClick={() => setCategory(slide.category)} 
                  className="btn btn-primary"
                >
                  {slide.btnText} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {/* Carousel controls */}
        <button 
          style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
          className="btn-icon-only"
          onClick={() => setSlideIndex(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
          className="btn-icon-only"
          onClick={() => setSlideIndex(prev => (prev + 1) % HERO_SLIDES.length)}
        >
          <ChevronRight size={20} />
        </button>
      </section>

      {/* Filter and Search controls */}
      <section className="filter-bar">
        <div className="search-bar-wrapper" ref={searchRef}>
          <Search className="search-icon-left" size={20} />
          <input 
            type="text" 
            placeholder="Search products, brands, tags..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            id="storefront-search"
          />
          {suggestions.length > 0 && (
            <div className="autocomplete-dropdown">
              {suggestions.map(suggestion => (
                <div 
                  key={suggestion.id}
                  className="autocomplete-item"
                  onClick={() => {
                    onSelectProduct(suggestion.id);
                    setSuggestions([]);
                    setSearch('');
                  }}
                >
                  <img src={suggestion.image} alt={suggestion.name} />
                  <div>
                    <div className="autocomplete-name">{suggestion.name}</div>
                    <div className="autocomplete-category">{suggestion.category} • ${suggestion.price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="category-pills">
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`category-pill ${category === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Products Section */}
      <section style={{ paddingBottom: '40px' }}>
        <h2 style={{ textAlign: 'left', marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>
          {category === 'All' ? 'All Products' : `${category} Collection`}
          {search && ` matching "${search}"`}
          <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '12px' }}>
            ({products.length} items found)
          </span>
        </h2>

        {loading ? (
          <div className="products-grid">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="skeleton-card">
                <div className="skeleton-image" />
                <div className="skeleton-text" style={{ width: '40%' }} />
                <div className="skeleton-text" style={{ width: '80%' }} />
                <div className="skeleton-text" style={{ width: '50%' }} />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
            <ShoppingBag size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ marginBottom: '8px' }}>No products found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Try adjusting your keywords or switching categories.</p>
            <button 
              onClick={() => { setSearch(''); setCategory('All'); }} 
              className="btn btn-secondary" 
              style={{ marginTop: '20px' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(prod => (
              <div 
                key={prod.id} 
                className="glass-panel glass-panel-hover product-card fade-in"
                onClick={() => onSelectProduct(prod.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="product-badge-overlay">
                  {prod.stock === 0 && <span className="badge badge-pink">Out Of Stock</span>}
                  {prod.stock > 0 && prod.stock <= 5 && <span className="badge badge-warning">Low Stock ({prod.stock})</span>}
                  {prod.tags && prod.tags.map(tag => (
                    <span key={tag} className="badge badge-purple">{tag}</span>
                  ))}
                </div>

                <div className="product-image-wrapper">
                  <img src={prod.image} alt={prod.name} className="product-image" loading="lazy" />
                </div>

                <div className="product-info">
                  <span className="product-cat">{prod.category}</span>
                  <h3 className="product-name" title={prod.name}>{prod.name}</h3>
                  
                  <div className="product-rating">
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          size={14} 
                          className={star <= Math.round(prod.rating) ? 'star-filled' : 'star-empty'} 
                        />
                      ))}
                    </div>
                    <span>{prod.rating.toFixed(1)} ({prod.reviewsCount})</span>
                  </div>

                  <div className="product-price-row">
                    <span className="product-price">${prod.price.toFixed(2)}</span>
                    <button 
                      className="product-action-btn"
                      title="Add to Cart"
                      disabled={prod.stock === 0 || addingToCartId === prod.id}
                      onClick={(e) => handleAddToCart(e, prod.id)}
                    >
                      {addingToCartId === prod.id ? (
                        <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>✓</span>
                      ) : (
                        <ShoppingBag size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
