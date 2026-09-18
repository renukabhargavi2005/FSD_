import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import * as db from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Log HTTP requests
app.use(morgan('dev'));

// Parse JSON request bodies
app.use(express.json());

// --- API Endpoints ---

// 1. Get filtered products
app.get('/api/products', async (req, res) => {
  try {
    const { search, category } = req.query;
    const products = await db.getProducts({ search, category });
    res.json(products);
  } catch (err) {
    console.error('Error in GET /api/products:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Get single product with reviews
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('Error in GET /api/products/:id:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Create product (Admin)
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = await db.addProduct(req.body);
    res.status(201).json(newProduct);
  } catch (err) {
    console.error('Error in POST /api/products:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Update product (Admin)
app.put('/api/products/:id', async (req, res) => {
  try {
    const updatedProduct = await db.updateProduct(req.params.id, req.body);
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(updatedProduct);
  } catch (err) {
    console.error('Error in PUT /api/products/:id:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. Delete product (Admin)
app.delete('/api/products/:id', async (req, res) => {
  try {
    const success = await db.deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /api/products/:id:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Post reviews to a product
app.post('/api/products/:id/reviews', async (req, res) => {
  try {
    const newReview = await db.addReview(req.params.id, req.body);
    if (!newReview) {
      return res.status(404).json({ error: 'Product not found to add review' });
    }
    res.status(201).json(newReview);
  } catch (err) {
    console.error('Error in POST /api/products/:id/reviews:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 7. Get populated cart
app.get('/api/cart', async (req, res) => {
  try {
    const cart = await db.getCart();
    res.json(cart);
  } catch (err) {
    console.error('Error in GET /api/cart:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 8. Add to cart
app.post('/api/cart', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (productId === undefined) {
      return res.status(400).json({ error: 'productId is required' });
    }
    const result = await db.addToCart(productId, parseInt(quantity, 10) || 1);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (err) {
    console.error('Error in POST /api/cart:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 9. Update quantity in cart
app.put('/api/cart/:productId', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined) {
      return res.status(400).json({ error: 'quantity is required' });
    }
    const result = await db.updateCartQuantity(req.params.productId, parseInt(quantity, 10));
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error in PUT /api/cart/:productId:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 10. Delete item from cart
app.delete('/api/cart/:productId', async (req, res) => {
  try {
    const result = await db.removeFromCart(req.params.productId);
    res.json(result);
  } catch (err) {
    console.error('Error in DELETE /api/cart/:productId:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 11. Checkout order
app.post('/api/checkout', async (req, res) => {
  try {
    const { shipping, payment } = req.body;
    if (!shipping || !payment) {
      return res.status(400).json({ error: 'Missing shipping or payment parameters' });
    }
    const result = await db.checkout(shipping, payment);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (err) {
    console.error('Error in POST /api/checkout:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 12. Get customer order history
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.getOrders();
    res.json(orders);
  } catch (err) {
    console.error('Error in GET /api/orders:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 13. Update order status (Admin)
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'status parameter is required' });
    }
    const updatedOrder = await db.updateOrderStatus(req.params.id, status);
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(updatedOrder);
  } catch (err) {
    console.error('Error in PUT /api/orders/:id/status:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 14. Get seller analytics dashboard data
app.get('/api/analytics', async (req, res) => {
  try {
    const analytics = await db.getAnalytics();
    res.json(analytics);
  } catch (err) {
    console.error('Error in GET /api/analytics:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Serve Frontend Static Build ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  console.log(`Serving static client files from ${distPath}`);
  app.use(express.static(distPath));
  
  // Single Page Application routing fallback
  app.get('*', (req, res, next) => {
    // Skip API routes so they return proper 404 instead of serving HTML
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server listening on HTTP port ${PORT}`);
});
