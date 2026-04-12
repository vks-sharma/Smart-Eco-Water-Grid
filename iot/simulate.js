const http = require('http');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const SENSOR_ID = process.env.SENSOR_ID || 'sensor-01';
const INTERVAL = 5000; // 5 seconds

// Generate realistic sensor data
function generateSensorData() {
  return {
    sensorId: SENSOR_ID,
    timestamp: new Date().toISOString(),
    ph: 6.5 + (Math.random() - 0.5) * 1.5, // pH range: 5.75 - 7.25

    // ✅ FIXED TURBIDITY RANGE
    turbidity: Math.random() * 15, // 0–15 NTU (safe + moderate + unsafe)

    temperature: 20 + (Math.random() - 0.5) * 8,
  };
}

// Send sensor data to backend
function sendSensorData() {
  const data = generateSensorData();
  
  const options = {
    hostname: new URL(BACKEND_URL).hostname,
    port: new URL(BACKEND_URL).port || (BACKEND_URL.includes('https') ? 443 : 80),
    path: '/sensor-data',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify(data)),
    },
  };

  const req = http.request(options, (res) => {
    console.log(`[${new Date().toISOString()}] Response status: ${res.statusCode}`);
  });

  req.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Error sending data:`, error.message);
  });

  console.log(`[${new Date().toISOString()}] Sending data:`, data);
  req.write(JSON.stringify(data));
  req.end();
}

// Start simulation
console.log(`Starting sensor simulation. Sending data every ${INTERVAL / 1000} seconds...`);
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Sensor ID: ${SENSOR_ID}`);

// Send initial data immediately
sendSensorData();

// Send data periodically
setInterval(sendSensorData, INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nSimulation stopped.');
  process.exit(0);
});
