let history = [];

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend')));

// In-memory store for the latest water data
let latestData = null;

/**
 * Water quality logic
 */
function analyzeWaterQuality(ph, turbidity) {
  if (ph < 6.5 || ph > 8.5 || turbidity > 10) {
    return { status: 'unsafe', action: 're-treat' };
  }

  if (turbidity > 5) {
    return { status: 'moderate', action: 'irrigation' };
  }

  return { status: 'safe', action: 'reuse' };
}

// POST /sensor-data
app.post('/sensor-data', (req, res) => {
  const { ph, turbidity, sensorId, timestamp } = req.body;

  // Validation
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

  // Analyze
  const { status, action } = analyzeWaterQuality(ph, turbidity);

  // Store latest data
  latestData = {
    sensorId: sensorId || "sensor-unknown",
    ph,
    turbidity,
    status,
    action,
    timestamp: timestamp || new Date().toISOString()
  };

  // Store history
  history.push(latestData);
  if (history.length > 50) history.shift();

  return res.status(200).json(latestData);
});

// GET latest data
app.get('/latest-data', (req, res) => {
  if (!latestData) {
    return res.status(404).json({ error: 'No data available yet. Submit sensor data first.' });
  }
  return res.status(200).json(latestData);
});

// GET history (NEW)
app.get('/history', (req, res) => {
  return res.status(200).json(history);
});

// ─── Deployment Map ──────────────────────────────────────────────────────────

// In-memory deployment state (demo — no database required)
const deploymentNodes = [
  { id: 'H1', type: 'house',   name: 'Cluster A (Houses)',  lat: 27.5004, lng: 77.6637, flow: 0.60, quality: 0.80 },
  { id: 'H2', type: 'house',   name: 'Cluster B (Houses)',  lat: 27.4954, lng: 77.6857, flow: 0.50, quality: 0.78 },
  { id: 'H3', type: 'house',   name: 'Cluster C (Houses)',  lat: 27.4864, lng: 77.6777, flow: 0.40, quality: 0.82 },
  { id: 'W1', type: 'wetland', name: 'Wetland STP 1',       lat: 27.4974, lng: 77.6727, flow: 0.70, quality: 0.72, capacity: 0.75 },
  { id: 'W2', type: 'wetland', name: 'Wetland STP 2',       lat: 27.4904, lng: 77.6757, flow: 0.60, quality: 0.76, capacity: 0.70 },
  { id: 'W3', type: 'wetland', name: 'Wetland STP 3',       lat: 27.4849, lng: 77.6657, flow: 0.55, quality: 0.80, capacity: 0.65 },
];

const deploymentLinks = [
  { id: 'L1', from: 'H1', to: 'W1', status: 'open', flow: 0.60 },
  { id: 'L2', from: 'H2', to: 'W2', status: 'open', flow: 0.50 },
  { id: 'L3', from: 'H3', to: 'W2', status: 'open', flow: 0.40 },
  { id: 'L4', from: 'W1', to: 'W2', status: 'open', flow: 0.45 },
  { id: 'L5', from: 'W2', to: 'W3', status: 'open', flow: 0.35 },
];

/** Generate AI recommendations from current node state */
function generateAiRecommendations() {
  const recs = [];
  for (const node of deploymentNodes) {
    if (node.type !== 'wetland') continue;
    if (node.capacity !== null && node.capacity !== undefined && node.flow > node.capacity) {
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

// GET /deployment-status — returns real-time node/link state + AI recommendations
app.get('/deployment-status', (req, res) => {
  // Simulate small real-time fluctuations in flow and quality
  for (const node of deploymentNodes) {
    node.flow    = Math.min(1, Math.max(0,   node.flow    + (Math.random() - 0.5) * 0.05));
    node.quality = Math.min(1, Math.max(0,   node.quality + (Math.random() - 0.5) * 0.03));
  }
  for (const link of deploymentLinks) {
    if (link.status === 'open') {
      link.flow = Math.min(1, Math.max(0.1, link.flow + (Math.random() - 0.5) * 0.05));
    }
  }

  // Build alerts
  const alerts = [];
  for (const node of deploymentNodes) {
    if (node.type !== 'wetland') continue;
    if (node.capacity !== null && node.capacity !== undefined && node.flow > node.capacity) {
      alerts.push({ nodeId: node.id, type: 'capacity', message: `${node.name} over capacity` });
    }
    if (node.quality < 0.65) {
      alerts.push({ nodeId: node.id, type: 'quality',  message: `${node.name} quality low` });
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

// POST /deployment-control — operator action on a specific link
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
  if (!link) {
    return res.status(404).json({ error: `Link ${linkId} not found.` });
  }

  // Apply the chosen operator action
  if (action === 'stop') {
    link.status = 'closed';
    link.flow   = 0;
  } else if (action === 'transfer') {
    link.status = 'open';
    link.flow   = Math.max(0.5, link.flow);
  } else if (action === 'retain') {
    link.status = 'throttled';
    link.flow   = Math.min(0.3, link.flow);
  }

  return res.status(200).json({ link, message: `Action '${action}' applied to link ${linkId}.` });
});

// Start server
app.listen(PORT, () => {
  console.log(`Smart Eco-Water Grid API running on http://localhost:${PORT}`);
});

module.exports = app;
