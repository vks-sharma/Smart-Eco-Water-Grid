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

// Start server
app.listen(PORT, () => {
  console.log(`Smart Eco-Water Grid API running on http://localhost:${PORT}`);
});

module.exports = app;
