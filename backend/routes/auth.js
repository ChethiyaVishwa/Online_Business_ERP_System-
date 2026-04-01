const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
require('dotenv').config();

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required.' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// Register (admin only)
router.post('/register', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin access required.' });

  const { username, email, password, role } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ success: false, message: 'All fields required.' });

  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, hash, role || 'staff']
    );
    res.status(201).json({ success: true, message: 'User registered successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ success: false, message: 'Email or username already exists.' });
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Get all users (admin)
router.get('/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  try {
    const [rows] = await db.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
