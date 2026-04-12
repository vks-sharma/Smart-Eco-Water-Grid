'use strict';

const { analyzeWaterQuality } = require('./decision');

describe('analyzeWaterQuality', () => {
    test('should return "safe" for safe inputs', () => {
        expect(analyzeWaterQuality({ pH: 7, turbidity: 5, temperature: 25 })).toBe('safe');
    });

    test('should return "unsafe" for unsafe inputs', () => {
        expect(analyzeWaterQuality({ pH: 14, turbidity: 100, temperature: 80 })).toBe('unsafe');
    });

    test('should handle edge case of pH < 0', () => {
        expect(analyzeWaterQuality({ pH: -1, turbidity: 5, temperature: 25 })).toBe('unsafe');
    });

    test('should handle edge case of turbidity > 100', () => {
        expect(analyzeWaterQuality({ pH: 7, turbidity: 101, temperature: 25 })).toBe('unsafe');
    });
});
