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

module.exports = analyzeWaterQuality;