import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, ShoppingBag, Send, AlertTriangle } from 'lucide-react';

export default function ProductDetail({ productId, onAddToCart, onBack }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  
  // Review form states
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState({ type: '', text: '' });

  // Fetch single product details (including relational reviews list)
  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        setActiveImage(data.image);
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      setLoading(true);
      fetchProductDetails();
      setQuantity(1);
    }
  }, [productId]);

  const handleQtyChange = (val) => {
    const nextVal = quantity + val;
    if (nextVal >= 1 && nextVal <= (product?.stock || 1)) {
      setQuantity(nextVal);
    }
  };

  const handleAddToCart = async () => {
    if (!product || product.stock === 0) return;
    setAddingToCart(true);
    await onAddToCart(product.id, quantity);
    setTimeout(() => setAddingToCart(false), 800);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewComment.trim()) {
      setReviewMessage({ type: 'error', text: 'Please fill in your name and comment.' });
      return;
    }

    setSubmittingReview(true);
    setReviewMessage({ type: '', text: '' });

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: reviewAuthor,
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (response.ok) {
        setReviewMessage({ type: 'success', text: 'Thank you! Your review has been added.' });
        setReviewAuthor('');
        setReviewComment('');
        setReviewRating(5);
        // Refresh product data to show new reviews and updated averages
        await fetchProductDetails();
      } else {
        setReviewMessage({ type: 'error', text: 'Failed to submit review. Try again.' });
      }
    } catch (err) {
      console.error(err);
      setReviewMessage({ type: 'error', text: 'Network error. Failed to send.' });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: '40px 0' }}>
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: '24px' }}>
          <ArrowLeft size={16} /> Back to Products
        </button>
        <div style={{ height: '350px' }} className="skeleton-card">
          <div className="skeleton-image" style={{ height: '100%' }} />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', marginTop: '40px' }}>
        <AlertTriangle size={48} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
        <h3>Product Not Found</h3>
        <p style={{ color: 'var(--text-muted)' }}>The product may have been discontinued or deleted by admin.</p>
        <button onClick={onBack} className="btn btn-primary" style={{ marginTop: '20px' }}>
          Back to Catalog
        </button>
      </div>
    );
  }

  // Calculate review statistics
  const reviews = product.reviews || [];
  const starsCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => {
    if (starsCount[r.rating] !== undefined) {
      starsCount[r.rating]++;
    }
  });

  return (
    <div className="fade-in" style={{ paddingBottom: '60px' }}>
      {/* Back button */}
      <button onClick={onBack} className="btn btn-secondary btn-sm" style={{ margin: '24px 0', display: 'flex' }}>
        <ArrowLeft size={16} /> Back to Products
      </button>

      {/* Main product detail grid */}
      <div className="detail-layout">
        {/* Left Side: Images */}
        <div className="detail-gallery">
          <div className="main-img-holder">
            <img src={activeImage} alt={product.name} />
          </div>
          {/* If we had multiple images we would render thumbnails. Let's make an active/placeholder gallery. */}
          <div className="thumbs-row">
            <button 
              className={`thumb-btn ${activeImage === product.image ? 'active' : ''}`}
              onClick={() => setActiveImage(product.image)}
            >
              <img src={product.image} alt={product.name} />
            </button>
            {/* Seeded extra visual angles for WOW factor */}
            <button 
              className={`thumb-btn ${activeImage === 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60' ? 'active' : ''}`}
              onClick={() => setActiveImage('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60')}
            >
              <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60" alt="Alternate View" />
            </button>
          </div>
        </div>

        {/* Right Side: Info details */}
        <div className="detail-info">
          <div>
            <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>{product.category}</span>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{product.name}</h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    size={16} 
                    className={star <= Math.round(product.rating) ? 'star-filled' : 'star-empty'} 
                  />
                ))}
              </div>
              <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                {product.rating.toFixed(1)}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                ({reviews.length} customer reviews)
              </span>
            </div>
          </div>

          <div className="detail-price-box">
            <span className="detail-price">${product.price.toFixed(2)}</span>
            {product.stock > 0 ? (
              <span className="badge badge-success">In Stock ({product.stock})</span>
            ) : (
              <span className="badge badge-pink">Out of Stock</span>
            )}
          </div>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{product.description}</p>

          {/* Quantity and Cart row */}
          {product.stock > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '16px 0' }}>
              <div className="qty-selector">
                <button onClick={() => handleQtyChange(-1)} className="qty-btn" disabled={quantity <= 1}>-</button>
                <span className="qty-value">{quantity}</span>
                <button onClick={() => handleQtyChange(1)} className="qty-btn" disabled={quantity >= product.stock}>+</button>
              </div>

              <button 
                onClick={handleAddToCart} 
                className="btn btn-primary" 
                style={{ flexGrow: 1 }}
                disabled={addingToCart}
              >
                <ShoppingBag size={20} />
                {addingToCart ? 'Added to Cart!' : 'Add to Cart'}
              </button>
            </div>
          )}

          {/* Technical Specs */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
              Product Specifications
            </h3>
            <table className="specs-table">
              <tbody>
                {product.specifications && Object.entries(product.specifications).length > 0 ? (
                  Object.entries(product.specifications).map(([key, val]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{val}</td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr><td>Category</td><td>{product.category}</td></tr>
                    <tr><td>Stock availability</td><td>{product.stock} units</td></tr>
                    <tr><td>Item ID</td><td>#NP-00{product.id}</td></tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="reviews-section">
          {/* Reviews Left Column - Aggregate metrics */}
          <div className="glass-panel rating-summary-card">
            <h3 style={{ fontSize: '1.3rem' }}>Customer Ratings</h3>
            <div className="rating-big-num text-gradient">{product.rating.toFixed(1)}</div>
            
            <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  size={20} 
                  className={star <= Math.round(product.rating) ? 'star-filled' : 'star-empty'} 
                />
              ))}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Based on {reviews.length} reviews</p>

            {/* Stars Breakdown progress bars */}
            <div className="rating-bars">
              {[5, 4, 3, 2, 1].map(num => {
                const count = starsCount[num] || 0;
                const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={num} className="rating-bar-row">
                    <span className="rating-bar-label">{num} Star</span>
                    <div className="rating-bar-outer">
                      <div className="rating-bar-inner" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="rating-bar-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews Right Column - Comments and Leave review Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel">
              <h3 style={{ marginBottom: '20px' }}>Leave a Review</h3>
              
              {reviewMessage.text && (
                <div 
                  className="badge" 
                  style={{ 
                    display: 'block', 
                    padding: '12px', 
                    borderRadius: 'var(--radius-sm)', 
                    marginBottom: '16px',
                    textAlign: 'center',
                    backgroundColor: reviewMessage.type === 'success' ? 'var(--success-glow)' : 'rgba(239, 68, 68, 0.1)',
                    color: reviewMessage.type === 'success' ? '#34d399' : '#f87171',
                    border: `1px solid ${reviewMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                  }}
                >
                  {reviewMessage.text}
                </div>
              )}

              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="review-author">Your Name</label>
                  <input 
                    type="text" 
                    id="review-author"
                    placeholder="Enter your name" 
                    value={reviewAuthor}
                    onChange={(e) => setReviewAuthor(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {[1, 2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setReviewRating(num)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Star 
                          size={24} 
                          className={num <= reviewRating ? 'star-filled' : 'star-empty'} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="review-comment">Review Comments</label>
                  <textarea 
                    id="review-comment"
                    rows="3" 
                    placeholder="Share your experience with this product..." 
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="form-control"
                    style={{ resize: 'vertical' }}
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={submittingReview}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <Send size={18} />
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            </div>

            {/* List of comments */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ textTransform: 'none' }}>Reviews ({reviews.length})</h3>
              {reviews.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No reviews yet. Be the first to rate this product!</p>
              ) : (
                reviews.map(rev => (
                  <div key={rev.id} className="glass-panel review-card fade-in">
                    <div className="review-header">
                      <span className="review-author">{rev.author}</span>
                      <span className="review-date">{rev.date}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          size={14} 
                          className={star <= rev.rating ? 'star-filled' : 'star-empty'} 
                        />
                      ))}
                    </div>
                    <p style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
