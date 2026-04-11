const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Water quality thresholds
const MIN_SAFE_PH = 6.5;
const MAX_SAFE_PH = 8.5;
const MAX_SAFE_TURBIDITY = 10;
const MIN_MODERATE_TURBIDITY = 5;
const MAX_MODERATE_TURBIDITY = 10;

// In-memory store for the latest water data
let latestData = null;

/**
 * Applies AI decision logic to determine water status and recommended action.
 * @param {number} ph - pH value of the water sample (0–14)
 * @param {number} turbidity - Turbidity value of the water sample (≥ 0)
 * @returns {{ status: string, action: string }}
 */
function analyzeWaterQuality(ph, turbidity) {
  if (ph < MIN_SAFE_PH || ph > MAX_SAFE_PH || turbidity > MAX_SAFE_TURBIDITY) {
    return { status: 'unsafe', action: 're-treat' };
  }
  if (turbidity >= MIN_MODERATE_TURBIDITY && turbidity <= MAX_MODERATE_TURBIDITY) {
    return { status: 'moderate', action: 'irrigation' };
  }
  return { status: 'safe', action: 'reuse' };
}

// POST /sensor-data – Accept and process incoming sensor readings
app.post('/sensor-data', (req, res) => {
  const { ph, turbidity } = req.body;

  // Validate that both fields are present and are numbers
  if (ph === undefined || turbidity === undefined) {
    return res.status(400).json({ error: 'Both ph and turbidity fields are required.' });
  }
  if (typeof ph !== 'number' || typeof turbidity !== 'number') {
    return res.status(400).json({ error: 'ph and turbidity must be numbers.' });
  }

  // Validate value ranges
  if (ph < 0 || ph > 14) {
    return res.status(400).json({ error: 'ph must be between 0 and 14.' });
  }
  if (turbidity < 0) {
    return res.status(400).json({ error: 'turbidity must be 0 or greater.' });
  }

  const { status, action } = analyzeWaterQuality(ph, turbidity);

  latestData = { ph, turbidity, status, action };

  return res.status(200).json(latestData);
});

// GET /latest-data – Return the most recently processed water data
app.get('/latest-data', (req, res) => {
  if (!latestData) {
    return res.status(404).json({ error: 'No data available yet. Submit sensor data first.' });
  }
  return res.status(200).json(latestData);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Smart Eco-Water Grid API running on http://localhost:${PORT}`);
});

module.exports = app;
