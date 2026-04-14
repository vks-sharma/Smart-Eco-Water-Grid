/**
 * AI Decision Module — Smart Eco-Water Grid
 *
 * Standalone water quality classification engine.
 * Provides analyzeWaterQuality(), sensorDataListener(), and sensorDataStore.
 *
 * This module is designed to be imported into any consumer that needs
 * event-driven sensor processing. The core server uses an inline version
 * of the classification logic for performance; this module is the
 * standalone, testable reference implementation.
 *
 * To integrate: const { sensorDataListener } = require('./ai/decision');
 */
const EventEmitter = require('events');

const sensorDataEventEmitter = new EventEmitter();

// In-memory store for processed sensor records (capped at MAX_STORE_SIZE entries)
const MAX_STORE_SIZE = 1000;
const sensorDataStore = [];

function analyzeWaterQuality(data) {
    const { ph, turbidity } = data;
    let status = 'safe';
    let recommendation = 'Water quality is good for consumption.';
    
    const issues = [];
    
    // Check pH levels
    if (ph < 6.5 || ph > 8.5) {
        status = 'unsafe';
        issues.push('pH level is outside safe range (6.5-8.5)');
    }
    
    // Check turbidity
    if (turbidity > 10) {
        status = 'unsafe';
        issues.push('Turbidity exceeds safe limit (max: 10)');
    }
    
    // Generate recommendation
    if (status === 'unsafe') {
        recommendation = 'Water is unsafe. Issues: ' + issues.join('; ') + '. Consider treatment or alternative water source.';
    }
    
    return {
        status: status,
        recommendation: recommendation,
        issues: issues
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