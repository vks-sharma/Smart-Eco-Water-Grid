'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// ── Per-node history (Map<sensorId, reading[]>) ────────────────────────────────
const NODE_HISTORY_CAP = 288; // 24 h at 5-min intervals
const nodeHistory = new Map();  // sensorId → reading[]
app.locals.nodeHistory = nodeHistory;

// Latest reading per node
const latestByNode = new Map(); // sensorId → reading

// ── Load node config ───────────────────────────────────────────────────────────
const NODES_FILE = path.join(__dirname, 'confg/nodes.json');
let nodesConfig = JSON.parse(fs.readFileSync(NODES_FILE, 'utf8'));
const deploymentNodes = nodesConfig.nodes;
const deploymentLinks = nodesConfig.links;

// ── Thresholds helper ──────────────────────────────────────────────────────────
const { loadThresholds } = require('./routes/settings');

function classifyParam(param, value) {
  if (value == null) return 'unknown';
  const th = loadThresholds()[param];
  if (!th) return 'unknown';
  const { safe, moderate, unsafe } = th;
  // Check unsafe first
  if (unsafe) {
    if (unsafe.min != null && value >= unsafe.min) return 'unsafe';
    if (unsafe.max != null && value <= unsafe.max) return 'unsafe';
  }
  // Check safe range
  const safeMin = safe && safe.min != null ? safe.min : -Infinity;
  const safeMax = safe && safe.max != null ? safe.max : Infinity;
  if (value >= safeMin && value <= safeMax) return 'safe';
  // Otherwise moderate
  return 'moderate';
}

function analyzeWaterQuality(reading) {
  const params = ['ph', 'turbidity', 'temperature', 'dissolvedOxygen', 'conductivity'];
  const statuses = params.map(p => classifyParam(p, reading[p]));
  if (statuses.includes('unsafe'))   return { status: 'unsafe',   action: 're-treat' };
  if (statuses.includes('moderate')) return { status: 'moderate', action: 'irrigation' };
  return { status: 'safe', action: 'reuse' };
}

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/auth',     require('./routes/auth'));
app.use('/settings', require('./routes/settings').router);
app.use('/nodes',    require('./routes/nodes'));

// POST /sensor-data
app.post('/sensor-data', (req, res) => {
  const { ph, turbidity, sensorId, timestamp, temperature, dissolvedOxygen, conductivity, tds } = req.body;

  if (ph === undefined || turbidity === undefined) {
    return res.status(400).json({ error: 'Both ph and turbidity fields are required.' });
  }
  if (typeof ph !== 'number' || typeof turbidity !== 'number') {
    return res.status(400).json({ error: 'ph and turbidity must be numbers.' });
  }
  if (ph < 0 || ph > 14) {
    return res.status(400).json({ error: 'ph must be between 0 and 14.' });
  }
  if (turbidity < 0) {
    return res.status(400).json({ error: 'turbidity must be 0 or greater.' });
  }

  const reading = {
    sensorId:        sensorId || 'sensor-unknown',
    ph,
    turbidity,
    temperature:     temperature     || null,
    dissolvedOxygen: dissolvedOxygen || null,
    conductivity:    conductivity    || null,
    tds:             tds             || null,
    timestamp:       timestamp       || new Date().toISOString(),
  };

  const { status, action } = analyzeWaterQuality(reading);
  reading.status = status;
  reading.action = action;

  // Per-node history
  const id = reading.sensorId;
  if (!nodeHistory.has(id)) nodeHistory.set(id, []);
  const hist = nodeHistory.get(id);
  hist.push(reading);
  if (hist.length > NODE_HISTORY_CAP) hist.shift();

  latestByNode.set(id, reading);

  return res.status(200).json(reading);
});

// GET /latest-data  (returns most recent reading across all nodes, or specific node)
app.get('/latest-data', (req, res) => {
  const { nodeId } = req.query;
  if (nodeId) {
    const data = latestByNode.get(nodeId);
    if (!data) return res.status(404).json({ error: 'No data for that node yet.' });
    return res.status(200).json(data);
  }
  // Return latest across all nodes (last inserted)
  let latest = null;
  for (const reading of latestByNode.values()) {
    if (!latest || reading.timestamp > latest.timestamp) latest = reading;
  }
  if (!latest) return res.status(404).json({ error: 'No data available yet. Submit sensor data first.' });
  return res.status(200).json(latest);
});

// GET /history
app.get('/history', (req, res) => {
  const { nodeId, limit } = req.query;
  const cap = parseInt(limit, 10) || 50;
  if (nodeId) {
    return res.status(200).json((nodeHistory.get(nodeId) || []).slice(-cap));
  }
  // Flatten all
  const all = [];
  for (const hist of nodeHistory.values()) all.push(...hist);
  all.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return res.status(200).json(all.slice(-cap));
});

// ── Deployment Map ─────────────────────────────────────────────────────────────

function generateAiRecommendations() {
  const recs = [];
  for (const node of deploymentNodes) {
    if (node.type !== 'wetland') continue;
    if (node.capacity != null && node.flow > node.capacity) {
      recs.push(`${node.name}: Flow exceeds capacity — throttle upstream inflow and open alternate route.`);
    }
    if (node.quality < 0.70) {
      recs.push(`${node.name}: Quality trending low — retain water for extra residence time and reduce outflow.`);
    }
  }
  if (recs.length === 0) {
    recs.push('All wetlands within capacity and quality stable. Continue normal operation.');
  }
  return recs;
}

app.get('/deployment-status', (req, res) => {
  for (const node of deploymentNodes) {
    node.flow    = Math.min(1, Math.max(0, node.flow    + (Math.random() - 0.5) * 0.05));
    node.quality = Math.min(1, Math.max(0, node.quality + (Math.random() - 0.5) * 0.03));
  }
  for (const link of deploymentLinks) {
    if (link.status === 'open') {
      link.flow = Math.min(1, Math.max(0.1, link.flow + (Math.random() - 0.5) * 0.05));
    }
  }

  const alerts = [];
  for (const node of deploymentNodes) {
    if (node.type !== 'wetland') continue;
    if (node.capacity != null && node.flow > node.capacity) {
      alerts.push({ nodeId: node.id, type: 'capacity', message: `${node.name} over capacity` });
    }
    if (node.quality < 0.65) {
      alerts.push({ nodeId: node.id, type: 'quality', message: `${node.name} quality low` });
    }
  }

  return res.status(200).json({
    center: { lat: 27.4924, lng: 77.6737, zoom: 13 },
    nodes:  deploymentNodes,
    links:  deploymentLinks,
    ai:     { recommendations: generateAiRecommendations() },
    alerts,
  });
});

app.post('/deployment-control', (req, res) => {
  const { linkId, action } = req.body;
  if (!linkId || !action) {
    return res.status(400).json({ error: 'linkId and action are required.' });
  }
  const validActions = ['stop', 'transfer', 'retain'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ error: `action must be one of: ${validActions.join(', ')}` });
  }
  const link = deploymentLinks.find(l => l.id === linkId);
  if (!link) return res.status(404).json({ error: `Link ${linkId} not found.` });

  if (action === 'stop')           { link.status = 'closed';    link.flow = 0; }
  else if (action === 'transfer')  { link.status = 'open';      link.flow = Math.max(0.5, link.flow); }
  else if (action === 'retain')    { link.status = 'throttled'; link.flow = Math.min(0.3, link.flow); }

  return res.status(200).json({ link, message: `Action '${action}' applied to link ${linkId}.` });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Smart Eco-Water Grid API running on http://localhost:${PORT}`);
});

module.exports = app;
