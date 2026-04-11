// Water Quality Thresholds Configuration
// Defines safe, moderate, and unsafe ranges for various water quality parameters

const waterQualityThresholds = {
    // pH Level (0-14 scale)
    pH: {
        safe: { min: 6.5, max: 8.5 },
        moderate: { min: 6.0, max: 6.49, orRange: { min: 8.51, max: 8.9 } },
        unsafe: { description: 'pH < 6.0 or pH > 8.9' }
    },

    // Turbidity (NTU - Nephelometric Turbidity Units)
    turbidity: {
        safe: { max: 5 },
        moderate: { min: 5.1, max: 10 },
        unsafe: { min: 10.1 }
    },

    // Temperature (Celsius)
    temperature: {
        safe: { min: 15, max: 28 },
        moderate: { min: 10, max: 14.9, orRange: { min: 28.1, max: 32 } },
        unsafe: { description: 'Temperature < 10°C or > 32°C' }
    },

    // Dissolved Oxygen (mg/L)
    dissolvedOxygen: {
        safe: { min: 6.5, max: 14 },
        moderate: { min: 5.0, max: 6.4 },
        unsafe: { max: 4.9 }
    },

    // Electrical Conductivity (µS/cm - Microsiemens per centimeter)
    conductivity: {
        safe: { max: 500 },
        moderate: { min: 501, max: 1500 },
        unsafe: { min: 1501 }
    },

    // Total Dissolved Solids (mg/L)
    TDS: {
        safe: { max: 500 },
        moderate: { min: 501, max: 1000 },
        unsafe: { min: 1001 }
    },

    // Hardness (mg/L CaCO₃)
    hardness: {
        safe: { max: 60 },
        moderate: { min: 61, max: 120 },
        unsafe: { min: 121 }
    },

    // Chloride (mg/L)
    chloride: {
        safe: { max: 250 },
        moderate: { min: 251, max: 400 },
        unsafe: { min: 401 }
    },

    // Ammonia (mg/L)
    ammonia: {
        safe: { max: 0.2 },
        moderate: { min: 0.21, max: 0.5 },
        unsafe: { min: 0.51 }
    }
};

// Water Quality Status Classification
const statusLevels = {
    safe: {
        label: 'Safe',
        description: 'Water quality is good for consumption',
        action: 'reuse',
        color: '#4caf50'
    },
    moderate: {
        label: 'Moderate',
        description: 'Water quality is acceptable for irrigation',
        action: 'irrigation',
        color: '#ff9800'
    },
    unsafe: {
        label: 'Unsafe',
        description: 'Water requires treatment before use',
        action: 're-treat',
        color: '#f44336'
    }
};

// Actions based on water quality status
const recommendedActions = {
    reuse: {
        description: 'Store and reuse for potable purposes',
        priority: 'high'
    },
    irrigation: {
        description: 'Use for agricultural irrigation',
        priority: 'medium'
    },
    'reTreat': {
        description: 'Route for additional treatment/processing',
        priority: 'critical'
    }
};

module.exports = {
    waterQualityThresholds,
    statusLevels,
    recommendedActions
};