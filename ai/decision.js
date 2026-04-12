const EventEmitter = require('events');

const sensorDataEventEmitter = new EventEmitter();

// Water quality thresholds
const MIN_SAFE_PH = 6.5;
const MAX_SAFE_PH = 8.5;
const MAX_SAFE_TURBIDITY = 10;
const MIN_MODERATE_TURBIDITY = 5;

// In-memory store for processed sensor records (capped at MAX_STORE_SIZE entries)
const MAX_STORE_SIZE = 1000;
const sensorDataStore = [];

function analyzeWaterQuality(data) {
    if (data === null || typeof data !== 'object') {
        throw new Error('data must be a non-null object.');
    }

    const { ph, turbidity } = data;

    // Input validation
    if (!Number.isFinite(ph) || ph < 0 || ph > 14) {
        throw new Error('ph must be a number between 0 and 14.');
    }
    if (!Number.isFinite(turbidity) || turbidity < 0) {
        throw new Error('turbidity must be a non-negative number.');
    }

    let status = 'safe';
    let action = 'reuse';
    let recommendation = 'Water quality is good for consumption.';
    const issues = [];

    // Check pH levels
    if (ph < MIN_SAFE_PH || ph > MAX_SAFE_PH) {
        status = 'unsafe';
        action = 're-treat';
        issues.push('pH level is outside safe range (6.5-8.5)');
    }

    // Check turbidity
    if (turbidity > MAX_SAFE_TURBIDITY) {
        status = 'unsafe';
        action = 're-treat';
        issues.push('Turbidity exceeds safe limit (max: 10)');
    } else if (turbidity >= MIN_MODERATE_TURBIDITY && status !== 'unsafe') {
        status = 'moderate';
        action = 'irrigation';
    }

    // Generate recommendation
    if (status === 'unsafe') {
        recommendation = 'Water is unsafe. Issues: ' + issues.join('; ') + '. Consider treatment or alternative water source.';
    } else if (status === 'moderate') {
        recommendation = 'Water quality is acceptable for irrigation use.';
    }

    return {
        status,
        action,
        recommendation,
        issues,
    };
}

/**
 * Listens for incoming sensor data events, analyzes water quality,
 * and stores the result together with the original sensor data.
 * @param {Function} [onStore] - Optional callback invoked with each stored record.
 * @returns {Function} Cleanup function that removes the event listener.
 */
function sensorDataListener(onStore) {
    function handleSensorData(sensorData) {
        const analysis = analyzeWaterQuality(sensorData);
        const record = {
            ...sensorData,
            analysis
        };
        if (sensorDataStore.length >= MAX_STORE_SIZE) {
            sensorDataStore.shift();
        }
        sensorDataStore.push(record);
        if (typeof onStore === 'function') {
            onStore(record);
        }
    }

    sensorDataEventEmitter.on('sensorData', handleSensorData);

    return function cleanup() {
        sensorDataEventEmitter.off('sensorData', handleSensorData);
    };
}

module.exports = {
    analyzeWaterQuality,
    sensorDataListener,
    sensorDataEventEmitter,
    sensorDataStore
};