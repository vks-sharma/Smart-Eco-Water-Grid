'use strict';

const { analyzeWaterQuality } = require('./decision.js');

describe('analyzeWaterQuality', () => {
    test('should return result object with status, action, recommendation, and issues', () => {
        const result = analyzeWaterQuality({ ph: 7, turbidity: 3 });
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('action');
        expect(result).toHaveProperty('recommendation');
        expect(result).toHaveProperty('issues');
    });

    test('should return "safe" status and "reuse" action for safe inputs', () => {
        const result = analyzeWaterQuality({ ph: 7, turbidity: 3 });
        expect(result.status).toBe('safe');
        expect(result.action).toBe('reuse');
    });

    test('should return "moderate" status and "irrigation" action for moderate turbidity', () => {
        const result = analyzeWaterQuality({ ph: 7, turbidity: 7 });
        expect(result.status).toBe('moderate');
        expect(result.action).toBe('irrigation');
    });

    test('should return "unsafe" status and "re-treat" action for high turbidity', () => {
        const result = analyzeWaterQuality({ ph: 7, turbidity: 50 });
        expect(result.status).toBe('unsafe');
        expect(result.action).toBe('re-treat');
    });

    test('should return "unsafe" status for pH out of range (too high)', () => {
        const result = analyzeWaterQuality({ ph: 9.5, turbidity: 3 });
        expect(result.status).toBe('unsafe');
        expect(result.action).toBe('re-treat');
    });

    test('should return "unsafe" status for pH out of range (too low)', () => {
        const result = analyzeWaterQuality({ ph: 5.0, turbidity: 3 });
        expect(result.status).toBe('unsafe');
    });

    test('should throw for invalid ph value (out of 0-14 range)', () => {
        expect(() => analyzeWaterQuality({ ph: -1, turbidity: 5 })).toThrow();
        expect(() => analyzeWaterQuality({ ph: 15, turbidity: 5 })).toThrow();
    });

    test('should throw for negative turbidity', () => {
        expect(() => analyzeWaterQuality({ ph: 7, turbidity: -1 })).toThrow();
    });
});
