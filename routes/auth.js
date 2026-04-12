'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const USERS_FILE = path.join(__dirname, '../confg/users.json');

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')).users || [];
  } catch {
    return [];
  }
}

// POST /auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required.' });
  }
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  return res.status(200).json({ token, username: user.username, role: user.role });
});

module.exports = router;
