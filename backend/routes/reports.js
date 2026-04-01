const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Dashboard KPIs
router.get('/kpis', authMiddleware, async (req, res) => {
  try {
    const [[revenue]] = await db.query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE status = 'completed' AND MONTH(sale_date) = MONTH(NOW()) AND YEAR(sale_date) = YEAR(NOW())`);
    const [[orders]] = await db.query(`SELECT COUNT(*) as total FROM sales WHERE MONTH(sale_date) = MONTH(NOW()) AND YEAR(sale_date) = YEAR(NOW())`);
    const [[totalRevenue]] = await db.query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE status = 'completed'`);
    const [[employees]] = await db.query(`SELECT COUNT(*) as total FROM employees WHERE status = 'active'`);
    const [[lowStock]] = await db.query(`SELECT COUNT(*) as total FROM products WHERE quantity <= reorder_level`);
    const [[totalProducts]] = await db.query(`SELECT COUNT(*) as total FROM products`);
    const [[pendingSales]] = await db.query(`SELECT COUNT(*) as total FROM sales WHERE status = 'pending'`);

    res.json({
      success: true,
      data: {
        monthlyRevenue: parseFloat(revenue.total),
        monthlyOrders: orders.total,
        totalRevenue: parseFloat(totalRevenue.total),
        activeEmployees: employees.total,
        lowStockAlerts: lowStock.total,
        totalProducts: totalProducts.total,
        pendingSales: pendingSales.total,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// Sales chart - last 7 days
router.get('/sales-chart', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        DATE(sale_date) as date,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as orders
      FROM sales
      WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND status = 'completed'
      GROUP BY DATE(sale_date)
      ORDER BY date ASC
    `);
    
    // Fill in missing days
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = rows.find(r => r.date.toISOString().split('T')[0] === dateStr);
      result.push({
        date: dateStr,
        revenue: found ? parseFloat(found.revenue) : 0,
        orders: found ? found.orders : 0
      });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// Top products by revenue
router.get('/top-products', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.name, p.category, 
             SUM(s.quantity) as units_sold,
             SUM(s.total_amount) as revenue
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE s.status = 'completed'
      GROUP BY p.id, p.name, p.category
      ORDER BY revenue DESC
      LIMIT 5
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// Revenue by category
router.get('/revenue-by-category', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.category, SUM(s.total_amount) as revenue, COUNT(*) as orders
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE s.status = 'completed'
      GROUP BY p.category
      ORDER BY revenue DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// Sales report with filters
router.get('/sales-report', authMiddleware, async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    let query = `
      SELECT s.*, p.name as product_name, p.category, e.name as employee_name
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      LEFT JOIN employees e ON s.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];
    if (from_date) { query += ' AND DATE(s.sale_date) >= ?'; params.push(from_date); }
    if (to_date) { query += ' AND DATE(s.sale_date) <= ?'; params.push(to_date); }
    query += ' ORDER BY s.sale_date DESC';

    const [rows] = await db.query(query, params);
    const [[totals]] = await db.query(
      `SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as count FROM sales WHERE status='completed' ${from_date ? 'AND DATE(sale_date) >= ?' : ''} ${to_date ? 'AND DATE(sale_date) <= ?' : ''}`,
      params
    );
    res.json({ success: true, data: rows, summary: { total: parseFloat(totals.total), count: totals.count } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// Inventory report with alerts
router.get('/inventory-report', authMiddleware, async (req, res) => {
  try {
    const [all] = await db.query('SELECT * FROM products ORDER BY quantity ASC');
    const [lowStock] = await db.query('SELECT * FROM products WHERE quantity <= reorder_level ORDER BY quantity ASC');
    const [[value]] = await db.query('SELECT COALESCE(SUM(quantity * unit_price), 0) as total FROM products');
    res.json({
      success: true,
      data: all,
      lowStock,
      totalValue: parseFloat(value.total)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// Recent activity
router.get('/recent-activity', authMiddleware, async (req, res) => {
  try {
    const [sales] = await db.query(`
      SELECT 'sale' as type, s.id, s.customer_name as name, s.total_amount as amount, s.sale_date as date, p.name as detail
      FROM sales s LEFT JOIN products p ON s.product_id = p.id
      ORDER BY s.sale_date DESC LIMIT 5
    `);
    res.json({ success: true, data: sales });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
