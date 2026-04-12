const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const SENSOR_ID   = process.env.SENSOR_ID   || 'sensor-01';
const INTERVAL    = parseInt(process.env.INTERVAL, 10) || 5000;

function rand(base, spread) {
  return Math.round((base + (Math.random() - 0.5) * spread * 2) * 100) / 100;
}

function generateSensorData() {
  return {
    sensorId:        SENSOR_ID,
    timestamp:       new Date().toISOString(),
    ph:              rand(7.0, 0.8),           // 6.2 – 7.8
    turbidity:       rand(6.0, 5.0),           // 1 – 11 NTU
    temperature:     rand(23.0, 6.0),          // 17 – 29 °C
    dissolvedOxygen: rand(7.5, 2.0),           // 5.5 – 9.5 mg/L
    conductivity:    rand(380, 150),           // 230 – 530 µS/cm
    tds:             rand(260, 100),           // 160 – 360 mg/L
  };
}

function sendSensorData() {
  const data    = generateSensorData();
  const payload = JSON.stringify(data);

  const options = {
    hostname: new URL(BACKEND_URL).hostname,
    port:     new URL(BACKEND_URL).port || (BACKEND_URL.startsWith('https') ? 443 : 80),
    path:     '/sensor-data',
    method:   'POST',
    headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
  };

  const req = http.request(options, res => {
    console.log(`[${new Date().toISOString()}] Response: ${res.statusCode}`);
  });

  req.on('error', err => {
    console.error(`[${new Date().toISOString()}] Error:`, err.message);
  });

  console.log(`[${new Date().toISOString()}] Sending:`, data);
  req.write(payload);
  req.end();
}

console.log(`Sensor simulation starting (interval: ${INTERVAL}ms)`);
console.log(`Backend: ${BACKEND_URL}  |  Sensor: ${SENSOR_ID}`);

sendSensorData();
setInterval(sendSensorData, INTERVAL);

process.on('SIGINT', () => { console.log('\nSimulation stopped.'); process.exit(0); });
