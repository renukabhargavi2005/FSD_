import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Plus, Edit2, Trash2, Package, RefreshCw, BarChart2, Check, Send } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'inventory', 'orders'
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // CRUD Modal Form States
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null); // null if creating, product object if editing
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Tech',
    stock: '',
    image: '',
    description: '',
    tags: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Analytics
      const resAnalytics = await fetch('/api/analytics');
      if (resAnalytics.ok) {
        const data = await resAnalytics.json();
        setAnalytics(data);
      }
      
      // Fetch Products
      const resProd = await fetch('/api/products');
      if (resProd.ok) {
        const data = await resProd.json();
        setProducts(data);
      }

      // Fetch Orders
      const resOrd = await fetch('/api/orders');
      if (resOrd.ok) {
        const data = await resOrd.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenCreate = () => {
    setEditProduct(null);
    setFormData({
      name: '',
      price: '',
      category: 'Tech',
      stock: '',
      image: '',
      description: '',
      tags: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (prod) => {
    setEditProduct(prod);
    setFormData({
      name: prod.name,
      price: prod.price,
      category: prod.category,
      stock: prod.stock,
      image: prod.image,
      description: prod.description || '',
      tags: prod.tags ? prod.tags.join(', ') : ''
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
    };

    try {
      const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products';
      const method = editProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowModal(false);
        fetchData();
      } else {
        alert('Failed to save product details.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This will also remove it from active shopping carts.')) return;
    
    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchData();
      } else {
        alert('Failed to delete product.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchData();
      } else {
        alert('Failed to update order status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="fade-in" style={{ padding: '40px 0' }}>
        <h2 style={{ textAlign: 'left', marginBottom: '24px' }}>Seller Dashboard</h2>
        <div style={{ height: '300px' }} className="skeleton-card" />
      </div>
    );
  }

  const metrics = analytics?.metrics || {
    totalSales: 0,
    totalOrders: 0,
    productsSold: 0,
    activeProductsCount: 0,
    averageOrderValue: 0
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '80px' }}>
      {/* Header section */}
      <div className="admin-header">
        <div style={{ textAlign: 'left' }}>
          <h1>Seller Portal</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage products, view sales metrics, and fulfill customer shipments.</p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary btn-sm">
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          onClick={() => setActiveTab('analytics')} 
          className={`admin-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
        >
          Analytics & Metrics
        </button>
        <button 
          onClick={() => setActiveTab('inventory')} 
          className={`admin-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
        >
          Product Catalog ({products.length})
        </button>
        <button 
          onClick={() => setActiveTab('orders')} 
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
        >
          Manage Shipments ({orders.length})
        </button>
      </div>

      {/* ==========================================
          Tab 1: Analytics Section
          ========================================== */}
      {activeTab === 'analytics' && analytics && (
        <div className="fade-in">
          {/* Metrics Grid */}
          <div className="analytics-grid">
            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ background: 'var(--grad-primary)' }}>
                <DollarSign size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-value">${metrics.totalSales.toFixed(2)}</span>
                <span className="metric-title">Total Revenue</span>
              </div>
            </div>

            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ background: 'var(--grad-cyan)' }}>
                <ShoppingCart size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-value">{metrics.totalOrders}</span>
                <span className="metric-title">Total Orders</span>
              </div>
            </div>

            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                <Package size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-value">{metrics.productsSold}</span>
                <span className="metric-title">Products Sold</span>
              </div>
            </div>

            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                <BarChart2 size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-value">${metrics.averageOrderValue.toFixed(2)}</span>
                <span className="metric-title">Avg Order Value</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-grid">
            {/* Chart 1: Revenue Monthly column chart */}
            <div className="glass-panel chart-card">
              <h3 style={{ fontSize: '1.15rem' }}>Revenue Stream Trend</h3>
              <div className="chart-container">
                {analytics.monthlyRevenue && analytics.monthlyRevenue.map(item => {
                  // Find max revenue to compute percentage height
                  const maxRev = Math.max(...analytics.monthlyRevenue.map(m => m.revenue)) || 1;
                  const heightPercent = (item.revenue / maxRev) * 100;
                  return (
                    <div key={item.month} className="chart-bar-col">
                      <div 
                        className="chart-bar-pillar" 
                        style={{ height: `${Math.max(heightPercent, 10)}%` }}
                      >
                        <div className="chart-bar-tooltip">${item.revenue.toFixed(2)}</div>
                      </div>
                      <span className="chart-bar-label">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Category distribution list */}
            <div className="glass-panel chart-card">
              <h3 style={{ fontSize: '1.15rem' }}>Sales Share by Category</h3>
              <div className="pie-rows" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                {analytics.categoryData && analytics.categoryData.map((cat, idx) => {
                  const colors = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#3b82f6'];
                  const color = colors[idx % colors.length];
                  
                  const totalShares = analytics.categoryData.reduce((sum, c) => sum + c.value, 0) || 1;
                  const sharePercent = (cat.value / totalShares) * 100;

                  return (
                    <div key={cat.name} className="pie-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="pie-legend-label">
                        <span className="pie-legend-color" style={{ backgroundColor: color }} />
                        <span>{cat.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '20px', fontWeight: 700 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{sharePercent.toFixed(0)}%</span>
                        <span>${cat.value.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
                {(!analytics.categoryData || analytics.categoryData.length === 0) && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No sales recorded yet to categorize.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          Tab 2: Inventory CRUD Section
          ========================================== */}
      {activeTab === 'inventory' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)' }}>Product Inventory List</h3>
            <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
              <Plus size={16} /> Add Product
            </button>
          </div>

          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Inventory Stock</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(prod => (
                  <tr key={prod.id}>
                    <td>
                      <img src={prod.image} alt={prod.name} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{prod.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #NP-00{prod.id}</div>
                    </td>
                    <td>
                      <span className="badge badge-purple">{prod.category}</span>
                    </td>
                    <td style={{ fontWeight: 800 }}>${prod.price.toFixed(2)}</td>
                    <td>
                      {prod.stock === 0 ? (
                        <span className="badge badge-pink">Sold Out</span>
                      ) : prod.stock <= 5 ? (
                        <span className="badge badge-warning">Low ({prod.stock})</span>
                      ) : (
                        <span style={{ fontWeight: 600 }}>{prod.stock} units</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button 
                          onClick={() => handleOpenEdit(prod)} 
                          className="btn-icon-only" 
                          title="Edit Product"
                          style={{ color: 'var(--secondary)' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(prod.id)} 
                          className="btn-icon-only" 
                          title="Delete Product"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          Tab 3: Shipment Orders Section
          ========================================== */}
      {activeTab === 'orders' && (
        <div className="fade-in">
          <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '20px', textAlign: 'left' }}>Fulfill Customer Orders</h3>

          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Info</th>
                  <th>Items Count</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th>Actions Toggle</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--text-heading)' }}>{order.id}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(order.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.shipping.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.shipping.email}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>${order.total.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${
                        order.status === 'Delivered' ? 'badge-success' :
                        order.status === 'Shipped' ? 'badge-cyan' : 'badge-warning'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {order.status === 'Processing' && (
                          <button 
                            onClick={() => handleOrderStatusUpdate(order.id, 'Shipped')} 
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Send size={12} /> Dispatch (Ship)
                          </button>
                        )}
                        {order.status === 'Shipped' && (
                          <button 
                            onClick={() => handleOrderStatusUpdate(order.id, 'Delivered')} 
                            className="btn btn-primary btn-sm"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Check size={12} /> Complete (Deliver)
                          </button>
                        )}
                        {order.status === 'Delivered' && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontStyle: 'italic', fontWeight: 600 }}>
                            Fulfillment Complete ✓
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No orders have been received yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          CRUD Create/Edit Modal Form
          ========================================== */}
      {showModal && (
        <div className="modal-overlay fade-in">
          <div className="glass-panel modal-content">
            <h2 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              {editProduct ? `Modify Product Details (#${editProduct.id})` : 'Catalog New Product Listing'}
            </h2>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="modal-name">Product Name</label>
                <input 
                  type="text" 
                  id="modal-name"
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  className="form-control" 
                  placeholder="e.g. Mechanical LED Keyboard"
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-price">Price ($ USD)</label>
                  <input 
                    type="number" 
                    id="modal-price"
                    name="price" 
                    value={formData.price} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    placeholder="99.99"
                    step="0.01" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-stock">Inventory Stock</label>
                  <input 
                    type="number" 
                    id="modal-stock"
                    name="stock" 
                    value={formData.stock} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    placeholder="15"
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-category">Category</label>
                  <select 
                    id="modal-category"
                    name="category" 
                    value={formData.category} 
                    onChange={handleInputChange} 
                    className="form-control"
                  >
                    <option value="Tech">Tech</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Home">Home</option>
                    <option value="Wellness">Wellness</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-tags">Tags (Comma-separated)</label>
                  <input 
                    type="text" 
                    id="modal-tags"
                    name="tags" 
                    value={formData.tags} 
                    onChange={handleInputChange} 
                    className="form-control" 
                    placeholder="New, Hot, Eco" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="modal-image">Image URL</label>
                <input 
                  type="url" 
                  id="modal-image"
                  name="image" 
                  value={formData.image} 
                  onChange={handleInputChange} 
                  className="form-control" 
                  placeholder="https://images.unsplash.com/..." 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="modal-desc">Description</label>
                <textarea 
                  id="modal-desc"
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  rows="3" 
                  className="form-control"
                  placeholder="Provide copy for storefront details description..."
                  required
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
