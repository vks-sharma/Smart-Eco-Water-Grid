'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const NODES_FILE = path.join(__dirname, '../confg/nodes.json');

function loadNodeConfig() {
  return JSON.parse(fs.readFileSync(NODES_FILE, 'utf8'));
}

// GET /nodes
router.get('/', (req, res) => {
  const config = loadNodeConfig();
  return res.status(200).json(config.nodes);
});

// GET /nodes/:nodeId
router.get('/:nodeId', (req, res) => {
  const config = loadNodeConfig();
  const node = config.nodes.find(n => n.id === req.params.nodeId);
  if (!node) return res.status(404).json({ error: 'Node not found.' });
  const history = req.app.locals.nodeHistory.get(req.params.nodeId) || [];
  const latest = history.length > 0 ? history[history.length - 1] : null;
  return res.status(200).json({ ...node, latestReading: latest });
});

// GET /nodes/:nodeId/history?limit=N
router.get('/:nodeId/history', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const history = req.app.locals.nodeHistory.get(req.params.nodeId) || [];
  return res.status(200).json(history.slice(-limit));
});

module.exports = router;
