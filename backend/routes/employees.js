const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// GET all employees
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, department, status } = req.query;
    let query = 'SELECT * FROM employees WHERE 1=1';
    const params = [];
    if (search) { query += ' AND (name LIKE ? OR email LIKE ? OR position LIKE ?)'; const s = `%${search}%`; params.push(s, s, s); }
    if (department) { query += ' AND department = ?'; params.push(department); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// GET single employee
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST create employee (admin only)
router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  const { name, email, phone, department, position, salary, hire_date, status } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });
  try {
    const [result] = await db.query(
      'INSERT INTO employees (name, email, phone, department, position, salary, hire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, department, position, salary || 0, hire_date, status || 'active']
    );
    const [newEmp] = await db.query('SELECT * FROM employees WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newEmp[0], message: 'Employee created successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Email already exists.' });
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// PUT update employee (admin only)
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  const { name, email, phone, department, position, salary, hire_date, status } = req.body;
  try {
    const [exist] = await db.query('SELECT id FROM employees WHERE id = ?', [req.params.id]);
    if (exist.length === 0) return res.status(404).json({ success: false, message: 'Employee not found.' });
    await db.query(
      'UPDATE employees SET name=?, email=?, phone=?, department=?, position=?, salary=?, hire_date=?, status=? WHERE id=?',
      [name, email, phone, department, position, salary, hire_date, status, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated[0], message: 'Employee updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// DELETE employee (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const [exist] = await db.query('SELECT id FROM employees WHERE id = ?', [req.params.id]);
    if (exist.length === 0) return res.status(404).json({ success: false, message: 'Employee not found.' });
    await db.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Employee deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// GET departments list
router.get('/meta/departments', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT department FROM employees WHERE department IS NOT NULL ORDER BY department');
    res.json({ success: true, data: rows.map(r => r.department) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
