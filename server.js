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
  const params = ['ph', 'turbidity', 'temperature', 'dissolvedOxygen', 'conductivity', 'tds'];
  const statuses = params.map(p => classifyParam(p, reading[p]));
  if (statuses.includes('unsafe'))   return { status: 'unsafe',   action: 're-treat' };
  if (statuses.includes('moderate')) return { status: 'moderate', action: 'irrigation' };
  return { status: 'safe', action: 'reuse' };
}

// ── Alert History ──────────────────────────────────────────────────────────────
const alertHistory = [];
const ALERT_HISTORY_CAP = 100;

function recordAlert(type, nodeId, message) {
  alertHistory.unshift({ type, nodeId, message, time: new Date().toISOString() });
  if (alertHistory.length > ALERT_HISTORY_CAP) alertHistory.pop();
}

// ── Smart Auto-Routing ─────────────────────────────────────────────────────────
// Called after each deployment-status drift update.
// Implements overflow throttling, pollution-spike output blocking, and recovery.
function autoRoute() {
  const events = [];

  for (const node of deploymentNodes) {
    if (node.type !== 'wetland') continue;

    // Overflow scenario: wetland flow exceeds capacity — throttle incoming links
    if (node.capacity != null && node.flow > node.capacity) {
      const incoming = deploymentLinks.filter(l => l.to === node.id && l.status === 'open');
      for (const link of incoming) {
        if (link.flow > 0.4) {
          link.status = 'throttled';
          link.flow   = Math.min(link.flow, 0.25);
          const msg = `Auto-throttled ${link.id} (${link.from}→${link.to}): ${node.name} over capacity`;
          recordAlert('overflow', node.id, msg);
          events.push(msg);
        }
      }
      // Try to open a bypass to the next wetland in the chain
      const bypass = deploymentLinks.find(
        l => l.from === node.id && l.status === 'closed' &&
             deploymentNodes.some(n => n.id === l.to && n.type === 'wetland')
      );
      if (bypass) {
        bypass.status = 'open';
        bypass.flow   = 0.3;
        const msg = `Auto-opened bypass ${bypass.id} (${bypass.from}→${bypass.to}) to relieve overflow at ${node.name}`;
        recordAlert('overflow', node.id, msg);
        events.push(msg);
      }
    }

    // Pollution spike: quality critically low — throttle outgoing non-wetland links
    if (node.quality < 0.65) {
      const outgoing = deploymentLinks.filter(l => l.from === node.id && l.status === 'open');
      for (const link of outgoing) {
        const target = deploymentNodes.find(n => n.id === link.to);
        if (target && target.type !== 'wetland') {
          link.status = 'throttled';
          link.flow   = Math.min(link.flow, 0.1);
          const msg = `Auto-throttled output ${link.id}: ${node.name} quality critical (${(node.quality * 100).toFixed(0)}%)`;
          recordAlert('quality', node.id, msg);
          events.push(msg);
        }
      }
    }

    // Recovery: restore throttled incoming links once flow is safely below capacity
    if (node.capacity != null && node.flow < node.capacity * 0.80) {
      const throttledIn = deploymentLinks.filter(l => l.to === node.id && l.status === 'throttled');
      for (const link of throttledIn) {
        link.status = 'open';
        link.flow   = Math.max(link.flow, 0.35);
        const msg = `Auto-restored ${link.id}: ${node.name} back within safe capacity`;
        recordAlert('recovery', node.id, msg);
        events.push(msg);
      }
    }
  }

  return events;
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
      recs.push(`⚠️ ${node.name}: Flow (${(node.flow * 100).toFixed(0)}%) exceeds capacity — throttle upstream inflow and open alternate route.`);
    } else if (node.capacity != null && node.flow > node.capacity * 0.85) {
      recs.push(`⚡ ${node.name}: Flow (${(node.flow * 100).toFixed(0)}%) approaching capacity — monitor closely.`);
    }
    if (node.quality < 0.65) {
      recs.push(`❌ ${node.name}: Quality critical (${(node.quality * 100).toFixed(0)}%) — route to re-treatment, block reuse output.`);
    } else if (node.quality < 0.75) {
      recs.push(`⚠️ ${node.name}: Quality low (${(node.quality * 100).toFixed(0)}%) — extend residence time, reduce outflow rate.`);
    }
  }
  if (recs.length === 0) {
    recs.push('✅ All wetlands within capacity and quality stable. Continue normal operation.');
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

  const routingEvents = autoRoute();

  return res.status(200).json({
    center: { lat: 27.4924, lng: 77.6737, zoom: 13 },
    nodes:  deploymentNodes,
    links:  deploymentLinks,
    ai:     { recommendations: generateAiRecommendations() },
    alerts,
    routingEvents,
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

// GET /alerts — recent auto-routing and quality alert history
app.get('/alerts', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  return res.status(200).json(alertHistory.slice(0, limit));
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Smart Eco-Water Grid API running on http://localhost:${PORT}`);
});

module.exports = app;
