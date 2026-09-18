import React, { useState } from 'react';
import { CreditCard, CheckCircle, Package, ArrowRight, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Checkout({ cartItems = [], onCheckoutSuccess, onBackToCatalog }) {
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Success
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  // Form Fields
  const [shipping, setShipping] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    zip: ''
  });

  const [payment, setPayment] = useState({
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    cardBrand: 'Visa'
  });

  const [cvvFocused, setCvvFocused] = useState(false);

  // Calculate Totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const shippingCost = subtotal > 100 ? 0.00 : 5.99;
  const total = subtotal + tax + shippingCost;

  const handleShippingChange = (e) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  const handlePaymentChange = (e) => {
    let { name, value } = e.target;
    
    // Format Card Number (adds spaces every 4 digits)
    if (name === 'cardNumber') {
      value = value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
      // Simple Brand Resolving
      const cleanVal = value.replace(/\s/g, '');
      let brand = 'Visa';
      if (cleanVal.startsWith('5')) brand = 'Mastercard';
      if (cleanVal.startsWith('3')) brand = 'Amex';
      setPayment({ ...payment, cardNumber: value, cardBrand: brand });
      return;
    }

    // Format Expiry (adds slash)
    if (name === 'cardExpiry') {
      value = value.replace(/\D/g, '');
      if (value.length > 2) {
        value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
      }
      setPayment({ ...payment, cardExpiry: value.slice(0, 5) });
      return;
    }

    // CVV Limit
    if (name === 'cardCvv') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }

    setPayment({ ...payment, [name]: value });
  };

  const nextStep = (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    }
  };

  const prevStep = () => {
    if (step === 2) setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipping, payment })
      });

      if (response.ok) {
        const result = await response.json();
        setOrderResult(result.order);
        setStep(3);
        
        // Trigger Confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        // Notify parent to refresh order count and cart
        onCheckoutSuccess();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to complete order. Please check stock levels.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while processing payment.');
    } finally {
      setLoading(false);
    }
  };

  // Render Success Screen
  if (step === 3 && orderResult) {
    return (
      <div className="fade-in">
        <div className="glass-panel success-card">
          <div className="success-icon-wrapper">
            <CheckCircle size={40} />
          </div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem' }}>Order Placed Successfully!</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Thank you for shopping with us. Your order <strong style={{ color: 'var(--text-heading)' }}>{orderResult.id}</strong> has been generated and is being processed.
          </p>

          {/* Timeline tracking status */}
          <div style={{ width: '100%', margin: '20px 0' }}>
            <h4 style={{ textAlign: 'left', marginBottom: '16px' }}>Delivery Progress</h4>
            <div className="timeline">
              <div className="timeline-step active">
                <div className="timeline-dot">1</div>
                <div className="timeline-label">Placed</div>
              </div>
              <div className="timeline-step active">
                <div className="timeline-dot">2</div>
                <div className="timeline-label">Processing</div>
              </div>
              <div className="timeline-step">
                <div className="timeline-dot">3</div>
                <div className="timeline-label">Shipped</div>
              </div>
              <div className="timeline-step">
                <div className="timeline-dot">4</div>
                <div className="timeline-label">Delivered</div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', width: '100%', paddingTop: '24px', textAlign: 'left' }}>
            <h4 style={{ marginBottom: '12px' }}>Order Details</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem' }}>
              <div><strong>Deliver to:</strong> {orderResult.shipping.name}</div>
              <div><strong>Address:</strong> {orderResult.shipping.address}, {orderResult.shipping.city} ({orderResult.shipping.zip})</div>
              <div><strong>Paid via:</strong> {orderResult.payment.cardBrand} ending in {orderResult.payment.lastFour}</div>
              <div><strong>Total Amount:</strong> ${orderResult.total.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
            <button onClick={onBackToCatalog} className="btn btn-primary">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h1 style={{ textAlign: 'left', margin: '32px 0 10px 0' }}>Checkout Portal</h1>
      <p style={{ textAlign: 'left', color: 'var(--text-muted)', marginBottom: '32px' }}>
        Complete your order below. Free shipping applies to orders over $100.
      </p>

      {cartItems.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <Package size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
          <h3>No items to check out</h3>
          <p style={{ color: 'var(--text-muted)' }}>Add products to your cart before proceeding.</p>
          <button onClick={onBackToCatalog} className="btn btn-primary" style={{ marginTop: '20px' }}>
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className="checkout-layout-grid checkout-grid">
          {/* Left Column: Form Forms */}
          <div className="glass-panel">
            {step === 1 ? (
              <form onSubmit={nextStep}>
                <div className="checkout-step-header">
                  <div className="step-number">1</div>
                  <h2>Shipping Information</h2>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ship-name">Full Name</label>
                  <input 
                    type="text" 
                    id="ship-name"
                    name="name" 
                    value={shipping.name} 
                    onChange={handleShippingChange} 
                    className="form-control" 
                    placeholder="John Doe" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ship-email">Email Address</label>
                  <input 
                    type="email" 
                    id="ship-email"
                    name="email" 
                    value={shipping.email} 
                    onChange={handleShippingChange} 
                    className="form-control" 
                    placeholder="john@example.com" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ship-address">Street Address</label>
                  <input 
                    type="text" 
                    id="ship-address"
                    name="address" 
                    value={shipping.address} 
                    onChange={handleShippingChange} 
                    className="form-control" 
                    placeholder="123 Neon Parkway" 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ship-city">City</label>
                    <input 
                      type="text" 
                      id="ship-city"
                      name="city" 
                      value={shipping.city} 
                      onChange={handleShippingChange} 
                      className="form-control" 
                      placeholder="Cyber City" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ship-zip">Zip Code</label>
                    <input 
                      type="text" 
                      id="ship-zip"
                      name="zip" 
                      value={shipping.zip} 
                      onChange={handleShippingChange} 
                      className="form-control" 
                      placeholder="90210" 
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '12px', width: '100%' }}>
                  Continue to Payment <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="checkout-step-header">
                  <div className="step-number">2</div>
                  <h2>Payment Details</h2>
                </div>

                {/* 3D-Flipping Credit Card widget */}
                <div className="card-widget-wrapper">
                  <div className={`card-widget ${cvvFocused ? 'flipped' : ''}`}>
                    {/* Front Face */}
                    <div className="card-face card-front">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="card-chip" />
                        <span className="card-brand">{payment.cardBrand}</span>
                      </div>
                      <div className="card-number-display">
                        {payment.cardNumber || '•••• •••• •••• ••••'}
                      </div>
                      <div className="card-meta-row">
                        <div>
                          <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>Card Holder</div>
                          <div className="card-name-display">{payment.cardName || 'YOUR FULL NAME'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>Expires</div>
                          <div>{payment.cardExpiry || 'MM/YY'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Back Face */}
                    <div className="card-face card-back">
                      <div className="card-stripe" />
                      <div className="card-cvv-stripe">
                        <span style={{ fontSize: '0.6rem', color: '#fff', marginRight: '10px', textTransform: 'uppercase' }}>CVV</span>
                        <div className="card-signature-box">
                          {payment.cardCvv || '•••'}
                        </div>
                      </div>
                      <div style={{ padding: '0 24px 20px 24px', fontSize: '0.65rem', opacity: 0.6, textAlign: 'center' }}>
                        Authorized Signature. Not valid unless signed. Mock secure payment widget.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="form-group">
                  <label className="form-label" htmlFor="card-name-input">Cardholder Name</label>
                  <input 
                    type="text" 
                    id="card-name-input"
                    name="cardName" 
                    value={payment.cardName} 
                    onChange={handlePaymentChange} 
                    placeholder="John Doe" 
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="card-num-input">Card Number</label>
                  <input 
                    type="text" 
                    id="card-num-input"
                    name="cardNumber" 
                    value={payment.cardNumber} 
                    onChange={handlePaymentChange} 
                    placeholder="4111 2222 3333 4444" 
                    maxLength="19"
                    className="form-control"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="card-exp-input">Expiration Date</label>
                    <input 
                      type="text" 
                      id="card-exp-input"
                      name="cardExpiry" 
                      value={payment.cardExpiry} 
                      onChange={handlePaymentChange} 
                      placeholder="MM/YY" 
                      maxLength="5"
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="card-cvv-input">CVV Code</label>
                    <input 
                      type="password" 
                      id="card-cvv-input"
                      name="cardCvv" 
                      value={payment.cardCvv} 
                      onChange={handlePaymentChange} 
                      placeholder="123" 
                      onFocus={() => setCvvFocused(true)}
                      onBlur={() => setCvvFocused(false)}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <button type="button" onClick={prevStep} className="btn btn-secondary" style={{ flexGrow: 1 }}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flexGrow: 2 }}
                    disabled={loading}
                  >
                    <CreditCard size={18} />
                    {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="glass-panel" style={{ height: 'fit-content' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              Order Summary
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '240px', overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
              {cartItems.map(item => (
                <div key={item.productId} style={{ display: 'flex', justifyItems: 'center', gap: '12px' }}>
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    style={{ width: '46px', height: '46px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} 
                  />
                  <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Qty: {item.quantity} • ${item.price.toFixed(2)}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', alignSelf: 'center' }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Estimated Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Shipping Cost</span>
                <span>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-heading)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                <span>Grand Total</span>
                <span className="text-gradient-purple">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
