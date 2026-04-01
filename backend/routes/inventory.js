const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// GET all products
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, category, low_stock } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    if (search) { query += ' AND (name LIKE ? OR sku LIKE ? OR supplier LIKE ?)'; const s = `%${search}%`; params.push(s, s, s); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (low_stock === 'true') { query += ' AND quantity <= reorder_level'; }
    query += ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// GET single product
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST create product
router.post('/', authMiddleware, async (req, res) => {
  const { name, sku, category, quantity, unit_price, reorder_level, supplier } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Product name is required.' });
  try {
    const [result] = await db.query(
      'INSERT INTO products (name, sku, category, quantity, unit_price, reorder_level, supplier) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, sku, category, quantity || 0, unit_price || 0, reorder_level || 10, supplier]
    );
    const [newProd] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newProd[0], message: 'Product added successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'SKU already exists.' });
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// PUT update product
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, sku, category, quantity, unit_price, reorder_level, supplier } = req.body;
  try {
    const [exist] = await db.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (exist.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });
    await db.query(
      'UPDATE products SET name=?, sku=?, category=?, quantity=?, unit_price=?, reorder_level=?, supplier=? WHERE id=?',
      [name, sku, category, quantity, unit_price, reorder_level, supplier, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated[0], message: 'Product updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// DELETE product (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const [exist] = await db.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (exist.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// GET categories
router.get('/meta/categories', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category');
    res.json({ success: true, data: rows.map(r => r.category) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET low-stock alerts count
router.get('/meta/alerts', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM products WHERE quantity <= reorder_level');
    res.json({ success: true, count: rows[0].count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
