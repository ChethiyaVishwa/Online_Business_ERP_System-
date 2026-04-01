const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// GET all sales with product & employee info
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, status, from_date, to_date, employee_id } = req.query;
    let query = `
      SELECT s.*, p.name as product_name, p.sku, e.name as employee_name
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      LEFT JOIN employees e ON s.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];
    if (search) { query += ' AND (s.customer_name LIKE ? OR p.name LIKE ?)'; const sv = `%${search}%`; params.push(sv, sv); }
    if (status) { query += ' AND s.status = ?'; params.push(status); }
    if (from_date) { query += ' AND DATE(s.sale_date) >= ?'; params.push(from_date); }
    if (to_date) { query += ' AND DATE(s.sale_date) <= ?'; params.push(to_date); }
    if (employee_id) { query += ' AND s.employee_id = ?'; params.push(employee_id); }
    query += ' ORDER BY s.sale_date DESC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// GET single sale
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, p.name as product_name, p.sku, e.name as employee_name
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      LEFT JOIN employees e ON s.employee_id = e.id
      WHERE s.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Sale not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST create sale (auto-deducts inventory)
router.post('/', authMiddleware, async (req, res) => {
  const { product_id, employee_id, customer_name, quantity, unit_price, status } = req.body;
  if (!product_id || !quantity || !unit_price)
    return res.status(400).json({ success: false, message: 'Product, quantity and unit price are required.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Check stock
    const [products] = await conn.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [product_id]);
    if (products.length === 0) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Product not found.' }); }
    const product = products[0];

    if (status !== 'pending' && product.quantity < quantity) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${product.quantity}` });
    }

    const total = parseFloat(quantity) * parseFloat(unit_price);
    const [result] = await conn.query(
      'INSERT INTO sales (product_id, employee_id, customer_name, quantity, unit_price, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [product_id, employee_id || null, customer_name, quantity, unit_price, total, status || 'completed']
    );

    // Deduct inventory for completed sales
    if (!status || status === 'completed') {
      await conn.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [quantity, product_id]);
    }

    await conn.commit();
    const [newSale] = await db.query(`
      SELECT s.*, p.name as product_name, e.name as employee_name
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      LEFT JOIN employees e ON s.employee_id = e.id
      WHERE s.id = ?
    `, [result.insertId]);
    res.status(201).json({ success: true, data: newSale[0], message: 'Sale recorded successfully.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  } finally {
    conn.release();
  }
});

// PUT update sale status (admin only)
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  const { status, customer_name } = req.body;
  try {
    const [exist] = await db.query('SELECT * FROM sales WHERE id = ?', [req.params.id]);
    if (exist.length === 0) return res.status(404).json({ success: false, message: 'Sale not found.' });

    // Handle inventory adjustments on status change
    const old = exist[0];
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      if (old.status !== 'completed' && status === 'completed') {
        await conn.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [old.quantity, old.product_id]);
      } else if (old.status === 'completed' && status === 'cancelled') {
        await conn.query('UPDATE products SET quantity = quantity + ? WHERE id = ?', [old.quantity, old.product_id]);
      }
      await conn.query('UPDATE sales SET status=?, customer_name=? WHERE id=?', [status || old.status, customer_name || old.customer_name, req.params.id]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const [updated] = await db.query(`
      SELECT s.*, p.name as product_name, e.name as employee_name
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      LEFT JOIN employees e ON s.employee_id = e.id
      WHERE s.id = ?
    `, [req.params.id]);
    res.json({ success: true, data: updated[0], message: 'Sale updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// DELETE sale (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const [exist] = await db.query('SELECT * FROM sales WHERE id = ?', [req.params.id]);
    if (exist.length === 0) return res.status(404).json({ success: false, message: 'Sale not found.' });
    await db.query('DELETE FROM sales WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Sale deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

module.exports = router;
