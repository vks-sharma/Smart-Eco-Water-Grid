const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const INTERVAL    = parseInt(process.env.INTERVAL, 10) || 5000;

// Each node has different baseline water quality characteristics.
// House clusters (H1–H3) have higher turbidity (raw wastewater).
// Wetland STPs (W1–W3) have progressively better quality after treatment.
const NODE_PROFILES = [
  { id: 'H1', phBase: 6.8, phSpread: 0.8, turbBase: 8.0, turbSpread: 3.5, tempBase: 24, doBase: 6.5, condBase: 480, condSpread: 120 },
  { id: 'H2', phBase: 7.0, phSpread: 0.8, turbBase: 7.5, turbSpread: 3.0, tempBase: 23, doBase: 7.0, condBase: 420, condSpread: 110 },
  { id: 'H3', phBase: 7.2, phSpread: 0.7, turbBase: 7.0, turbSpread: 3.0, tempBase: 23, doBase: 7.2, condBase: 400, condSpread: 100 },
  { id: 'W1', phBase: 7.4, phSpread: 0.5, turbBase: 4.5, turbSpread: 2.5, tempBase: 22, doBase: 7.8, condBase: 340, condSpread:  80 },
  { id: 'W2', phBase: 7.3, phSpread: 0.5, turbBase: 4.0, turbSpread: 2.0, tempBase: 22, doBase: 7.9, condBase: 300, condSpread:  70 },
  { id: 'W3', phBase: 7.5, phSpread: 0.5, turbBase: 3.5, turbSpread: 2.0, tempBase: 21, doBase: 8.0, condBase: 280, condSpread:  60 },
];

let profileIndex = 0;

function rand(base, spread) {
  return Math.round((base + (Math.random() - 0.5) * spread * 2) * 100) / 100;
}

function generateSensorData() {
  const profile = NODE_PROFILES[profileIndex];
  profileIndex  = (profileIndex + 1) % NODE_PROFILES.length;

  const conductivity = Math.max(0, rand(profile.condBase, profile.condSpread));
  const tds          = Math.round(conductivity * 0.67 * 100) / 100;

  return {
    sensorId:        profile.id,
    timestamp:       new Date().toISOString(),
    ph:              Math.max(0, Math.min(14, rand(profile.phBase,   profile.phSpread))),
    turbidity:       Math.max(0, rand(profile.turbBase, profile.turbSpread)),
    temperature:     rand(profile.tempBase, 5.0),
    dissolvedOxygen: Math.max(0, rand(profile.doBase,   1.5)),
    conductivity,
    tds,
  };
}

function sendSensorData() {
  const data    = generateSensorData();
  const payload = JSON.stringify(data);

  const url     = new URL(BACKEND_URL);
  const options = {
    hostname: url.hostname,
    port:     url.port || (BACKEND_URL.startsWith('https') ? 443 : 80),
    path:     '/sensor-data',
    method:   'POST',
    headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
  };

  const req = http.request(options, res => {
    console.log(`[${new Date().toISOString()}] [${data.sensorId}] → ${res.statusCode}`);
  });

  req.on('error', err => {
    console.error(`[${new Date().toISOString()}] Error:`, err.message);
  });

  console.log(`[${new Date().toISOString()}] Sending [${data.sensorId}]:`, JSON.stringify(data));
  req.write(payload);
  req.end();
}

console.log(`Sensor simulation starting — interval: ${INTERVAL}ms, nodes: ${NODE_PROFILES.map(p => p.id).join(', ')}`);
console.log(`Backend: ${BACKEND_URL}`);

sendSensorData();
setInterval(sendSensorData, INTERVAL);

process.on('SIGINT', () => { console.log('\nSimulation stopped.'); process.exit(0); });

