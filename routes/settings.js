'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');
const { waterQualityThresholds } = require('../confg/constants');

const router = express.Router();
const THRESHOLDS_FILE = path.join(__dirname, '../confg/thresholds.json');

function loadThresholds() {
  try {
    return JSON.parse(fs.readFileSync(THRESHOLDS_FILE, 'utf8'));
  } catch {
    // Fall back to constants.js defaults
    return {
      ph:              waterQualityThresholds.pH,
      turbidity:       waterQualityThresholds.turbidity,
      temperature:     waterQualityThresholds.temperature,
      dissolvedOxygen: waterQualityThresholds.dissolvedOxygen,
      conductivity:    waterQualityThresholds.conductivity,
    };
  }
}

// GET /settings/thresholds
router.get('/thresholds', (req, res) => {
  return res.status(200).json(loadThresholds());
});

// PUT /settings/thresholds  (admin only)
router.put('/thresholds', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required.' });
  }
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Request body must be a JSON object.' });
  }
  const current = loadThresholds();
  const merged = { ...current, ...updates };
  try {
    fs.writeFileSync(THRESHOLDS_FILE, JSON.stringify(merged, null, 2), 'utf8');
    return res.status(200).json(merged);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save thresholds.' });
  }
});

module.exports = { router, loadThresholds };
