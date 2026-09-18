import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'db.json');

// Helper to read database
async function readDB() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file, returning empty schema:', error);
    return { products: [], reviews: [], cart: [], orders: [] };
  }
}

// Helper to write database
async function writeDB(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

// --- Product Operations ---

export async function getProducts({ search = '', category = '' } = {}) {
  const db = await readDB();
  let products = db.products;

  if (category && category !== 'All') {
    products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const query = search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  return products;
}

export async function getProductById(id) {
  const db = await readDB();
  const numericId = parseInt(id, 10);
  const product = db.products.find(p => p.id === numericId);
  if (!product) return null;

  // Relational fetch of reviews
  const reviews = db.reviews.filter(r => r.productId === numericId);
  return {
    ...product,
    reviews
  };
}

export async function addProduct(productData) {
  const db = await readDB();
  const nextId = db.products.length > 0 ? Math.max(...db.products.map(p => p.id)) + 1 : 1;
  
  const newProduct = {
    id: nextId,
    name: productData.name || 'Unnamed Product',
    price: parseFloat(productData.price) || 0.00,
    description: productData.description || '',
    category: productData.category || 'Uncategorized',
    image: productData.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=60',
    rating: 5.0,
    reviewsCount: 0,
    stock: parseInt(productData.stock, 10) || 0,
    tags: Array.isArray(productData.tags) ? productData.tags : (productData.tags ? productData.tags.split(',').map(t => t.trim()) : []),
    specifications: productData.specifications || {}
  };

  db.products.push(newProduct);
  await writeDB(db);
  return newProduct;
}

export async function updateProduct(id, productData) {
  const db = await readDB();
  const numericId = parseInt(id, 10);
  const index = db.products.findIndex(p => p.id === numericId);
  
  if (index === -1) return null;

  const current = db.products[index];
  const updatedProduct = {
    ...current,
    name: productData.name !== undefined ? productData.name : current.name,
    price: productData.price !== undefined ? parseFloat(productData.price) : current.price,
    description: productData.description !== undefined ? productData.description : current.description,
    category: productData.category !== undefined ? productData.category : current.category,
    image: productData.image !== undefined ? productData.image : current.image,
    stock: productData.stock !== undefined ? parseInt(productData.stock, 10) : current.stock,
    tags: productData.tags !== undefined ? (Array.isArray(productData.tags) ? productData.tags : productData.tags.split(',').map(t => t.trim())) : current.tags,
    specifications: productData.specifications !== undefined ? productData.specifications : current.specifications
  };

  db.products[index] = updatedProduct;
  await writeDB(db);
  return updatedProduct;
}

export async function deleteProduct(id) {
  const db = await readDB();
  const numericId = parseInt(id, 10);
  const initialLength = db.products.length;
  
  db.products = db.products.filter(p => p.id !== numericId);
  // Clean up reviews for deleted product
  db.reviews = db.reviews.filter(r => r.productId !== numericId);
  // Clean up active cart items
  db.cart = db.cart.filter(item => item.productId !== numericId);

  if (db.products.length === initialLength) return false;
  
  await writeDB(db);
  return true;
}

// --- Review Operations ---

export async function addReview(productId, reviewData) {
  const db = await readDB();
  const numericProductId = parseInt(productId, 10);
  const product = db.products.find(p => p.id === numericProductId);
  
  if (!product) return null;

  const nextId = db.reviews.length > 0 ? Math.max(...db.reviews.map(r => r.id)) + 1 : 1;
  const newReview = {
    id: nextId,
    productId: numericProductId,
    author: reviewData.author || 'Anonymous',
    rating: parseInt(reviewData.rating, 10) || 5,
    comment: reviewData.comment || '',
    date: new Date().toISOString().split('T')[0]
  };

  db.reviews.push(newReview);

  // Recalculate average rating & reviewsCount for product
  const productReviews = db.reviews.filter(r => r.productId === numericProductId);
  const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
  
  product.rating = parseFloat(avgRating.toFixed(1));
  product.reviewsCount = productReviews.length;

  await writeDB(db);
  return newReview;
}

// --- Cart Operations ---

export async function getCart() {
  const db = await readDB();
  // Populate cart items with product details
  const populatedCart = db.cart.map(cartItem => {
    const product = db.products.find(p => p.id === cartItem.productId);
    if (!product) return null;
    return {
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock
    };
  }).filter(Boolean);

  return populatedCart;
}

export async function addToCart(productId, quantity = 1) {
  const db = await readDB();
  const numericId = parseInt(productId, 10);
  const product = db.products.find(p => p.id === numericId);
  
  if (!product) return { success: false, message: 'Product not found' };
  
  const existingCartItem = db.cart.find(item => item.productId === numericId);
  const targetQty = (existingCartItem ? existingCartItem.quantity : 0) + quantity;

  if (targetQty > product.stock) {
    return { success: false, message: `Insufficient stock. Only ${product.stock} items available.` };
  }

  if (existingCartItem) {
    existingCartItem.quantity = targetQty;
  } else {
    db.cart.push({ productId: numericId, quantity });
  }

  await writeDB(db);
  return { success: true, cart: db.cart };
}

export async function updateCartQuantity(productId, quantity) {
  const db = await readDB();
  const numericId = parseInt(productId, 10);
  const product = db.products.find(p => p.id === numericId);
  
  if (!product) return { success: false, message: 'Product not found' };
  if (quantity > product.stock) {
    return { success: false, message: `Only ${product.stock} items in stock.` };
  }

  const existingCartItem = db.cart.find(item => item.productId === numericId);
  if (!existingCartItem) return { success: false, message: 'Item not in cart' };

  if (quantity <= 0) {
    db.cart = db.cart.filter(item => item.productId !== numericId);
  } else {
    existingCartItem.quantity = quantity;
  }

  await writeDB(db);
  return { success: true };
}

export async function removeFromCart(productId) {
  const db = await readDB();
  const numericId = parseInt(productId, 10);
  db.cart = db.cart.filter(item => item.productId !== numericId);
  await writeDB(db);
  return { success: true };
}

export async function clearCart() {
  const db = await readDB();
  db.cart = [];
  await writeDB(db);
  return { success: true };
}

// --- Checkout & Orders ---

export async function checkout(shipping, payment) {
  const db = await readDB();
  if (db.cart.length === 0) return { success: false, message: 'Cart is empty' };

  // Verify and resolve items
  const orderItems = [];
  for (const cartItem of db.cart) {
    const product = db.products.find(p => p.id === cartItem.productId);
    if (!product) {
      return { success: false, message: `Product ID ${cartItem.productId} no longer exists.` };
    }
    if (product.stock < cartItem.quantity) {
      return { success: false, message: `Insufficient stock for ${product.name}.` };
    }
    
    // Deduct stock!
    product.stock -= cartItem.quantity;
    
    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: cartItem.quantity
    });
  }

  // Calculate pricing
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% sales tax
  const shippingCost = subtotal > 100 ? 0.00 : 5.99; // Free shipping over $100
  const total = subtotal + tax + shippingCost;

  // Generate order
  const nextOrderNum = Math.floor(1000 + Math.random() * 9000);
  const newOrder = {
    id: `ORD-${nextOrderNum}`,
    date: new Date().toISOString(),
    items: orderItems,
    shipping,
    payment: {
      cardBrand: payment.cardBrand || 'Visa',
      lastFour: payment.cardNumber ? payment.cardNumber.replace(/\s/g, '').slice(-4) : '4242'
    },
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    shippingCost: parseFloat(shippingCost.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    status: 'Processing'
  };

  db.orders.push(newOrder);
  db.cart = []; // Empty cart
  await writeDB(db);
  
  return { success: true, order: newOrder };
}

export async function getOrders() {
  const db = await readDB();
  // Return orders sorted by date descending
  return [...db.orders].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function updateOrderStatus(orderId, status) {
  const db = await readDB();
  const order = db.orders.find(o => o.id === orderId);
  if (!order) return null;

  order.status = status; // 'Processing', 'Shipped', 'Delivered'
  await writeDB(db);
  return order;
}

// --- Analytics ---

export async function getAnalytics() {
  const db = await readDB();
  const orders = db.orders;

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  
  // Total products sold
  let productsSold = 0;
  const categorySales = {};
  
  // Pre-fill categories with 0
  db.products.forEach(p => {
    categorySales[p.category] = 0;
  });

  orders.forEach(o => {
    o.items.forEach(item => {
      productsSold += item.quantity;
      // Resolve category
      const prod = db.products.find(p => p.id === item.productId);
      const cat = prod ? prod.category : 'Unknown';
      categorySales[cat] = (categorySales[cat] || 0) + (item.price * item.quantity);
    });
  });

  // Format category sales as a list
  const categoryData = Object.entries(categorySales).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2))
  }));

  // Mock revenue trends by month (or dynamically from orders)
  // Let's create an array of last 5 months
  const monthlyRevenue = [
    { month: 'Feb', revenue: parseFloat((totalSales * 0.15).toFixed(2)) },
    { month: 'Mar', revenue: parseFloat((totalSales * 0.20).toFixed(2)) },
    { month: 'Apr', revenue: parseFloat((totalSales * 0.25).toFixed(2)) },
    { month: 'May', revenue: parseFloat((totalSales * 0.18).toFixed(2)) },
    { month: 'Jun', revenue: parseFloat((totalSales * 0.22).toFixed(2)) }
  ];

  return {
    metrics: {
      totalSales: parseFloat(totalSales.toFixed(2)),
      totalOrders,
      productsSold,
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      activeProductsCount: db.products.length
    },
    categoryData,
    monthlyRevenue
  };
}
