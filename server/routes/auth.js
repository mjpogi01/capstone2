const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../lib/db');

const router = express.Router();

function signToken(payload) {
  return jwt.sign(payload, 'yohanns_super_secure_jwt_secret_2024_xyz789_abc123_def456_ghi789_jkl012_mno345_pqr678_stu901_vwx234_yz567', { expiresIn: '7d' });
}

router.post('/signup', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, address1, address2, city, province, postal_code, country } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (String(password).length < 8) return res.status(400).json({ error: 'Password too short' });

    const { rows: existing } = await query('SELECT id FROM users WHERE email=$1', [normalizedEmail]);
    if (existing.length) return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `INSERT INTO users (
        email, password_hash, first_name, last_name, phone, address1, address2, city, province, postal_code, country, role, branch_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
      ) RETURNING id, email, first_name, last_name, phone, address1, address2, city, province, postal_code, country, role, branch_id, created_at`,
      [
        normalizedEmail, passwordHash,
        first_name || null, last_name || null, phone || null,
        address1 || null, address2 || null, city || null,
        province || null, postal_code || null, country || null,
        'customer', null // Default role is customer, no branch_id
      ]
    );
    const user = rows[0];
    const token = signToken({ sub: user.id, email: user.email });
    return res.status(201).json({ user, token });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const normalizedEmail = String(email).trim().toLowerCase();
    const { rows } = await query('SELECT id, email, password_hash, first_name, last_name, phone, address1, address2, city, province, postal_code, country, role, branch_id FROM users WHERE email=$1', [normalizedEmail]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ sub: user.id, email: user.email });
    const resultUser = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      address1: user.address1,
      address2: user.address2,
      city: user.city,
      province: user.province,
      postal_code: user.postal_code,
      country: user.country,
      role: user.role,
      branch_id: user.branch_id
    };
    return res.json({ user: resultUser, token });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;



