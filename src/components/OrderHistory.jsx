import React, { useState, useEffect } from 'react';
import { ShoppingBag, ChevronDown, ChevronUp, Package, Calendar } from 'lucide-react';

export default function OrderHistory({ onBackToCatalog }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching order history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleExpand = (id) => {
    if (expandedOrderId === id) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(id);
    }
  };

  const getStatusStep = (status) => {
    switch (status) {
      case 'Processing': return 2;
      case 'Shipped': return 3;
      case 'Delivered': return 4;
      default: return 1; // Placed
    }
  };

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: '40px 0' }}>
        <h2 style={{ textAlign: 'left', marginBottom: '24px' }}>Your Purchases</h2>
        <div style={{ height: '200px' }} className="skeleton-card" />
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ paddingBottom: '60px' }}>
      <h1 style={{ textAlign: 'left', margin: '32px 0 10px 0' }}>Your Purchase History</h1>
      <p style={{ textAlign: 'left', color: 'var(--text-muted)', marginBottom: '32px' }}>
        Track active shipments, view receipts, and monitor delivery progress.
      </p>

      {orders.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <ShoppingBag size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
          <h3>No orders yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>You haven't placed any orders yet.</p>
          <button onClick={onBackToCatalog} className="btn btn-primary" style={{ marginTop: '20px' }}>
            Go Shopping
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {orders.map(order => {
            const isExpanded = expandedOrderId === order.id;
            const currentStep = getStatusStep(order.status);
            const dateStr = new Date(order.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={order.id} className="glass-panel fade-in" style={{ padding: '24px', textAlign: 'left' }}>
                {/* Order Top Bar Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order ID</div>
                      <div style={{ fontWeight: 800, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Package size={16} /> {order.id}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date Placed</div>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={16} /> {dateStr}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Cost</div>
                      <div style={{ fontWeight: 800, color: 'var(--primary)' }}>${order.total.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className={`badge ${
                      order.status === 'Delivered' ? 'badge-success' : 
                      order.status === 'Shipped' ? 'badge-cyan' : 'badge-warning'
                    }`}>
                      {order.status}
                    </span>
                    <button 
                      onClick={() => toggleExpand(order.id)}
                      className="btn-icon-only"
                      style={{ borderRadius: '50%', width: '36px', height: '36px' }}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Delivery Timeline Progress */}
                <div style={{ margin: '24px 0 32px 0' }}>
                  <div className="timeline">
                    <div className={`timeline-step ${currentStep >= 1 ? 'completed' : ''} ${currentStep === 1 ? 'active' : ''}`}>
                      <div className="timeline-dot">1</div>
                      <div className="timeline-label">Placed</div>
                    </div>
                    <div className={`timeline-step ${currentStep >= 2 ? 'completed' : ''} ${currentStep === 2 ? 'active' : ''}`}>
                      <div className="timeline-dot">2</div>
                      <div className="timeline-label">Processing</div>
                    </div>
                    <div className={`timeline-step ${currentStep >= 3 ? 'completed' : ''} ${currentStep === 3 ? 'active' : ''}`}>
                      <div className="timeline-dot">3</div>
                      <div className="timeline-label">Shipped</div>
                    </div>
                    <div className={`timeline-step ${currentStep >= 4 ? 'completed' : ''} ${currentStep === 4 ? 'active' : ''}`}>
                      <div className="timeline-dot">4</div>
                      <div className="timeline-label">Delivered</div>
                    </div>
                  </div>
                </div>

                {/* Collapsible Items details */}
                {isExpanded && (
                  <div className="fade-in" style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ marginBottom: '12px' }}>Items Summary</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                      {order.items.map(item => (
                        <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} 
                            />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Qty: {item.quantity} • ${item.price.toFixed(2)}</div>
                            </div>
                          </div>
                          <div style={{ fontWeight: 700 }}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <h4 style={{ marginBottom: '8px' }}>Shipping Address</h4>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                        <div>{order.shipping.name}</div>
                        <div>{order.shipping.address}</div>
                        <div>{order.shipping.city}, {order.shipping.zip}</div>
                        <div>{order.shipping.email}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
