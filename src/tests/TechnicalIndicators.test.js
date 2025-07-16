const TechnicalIndicators = require('../indicators/TechnicalIndicators');

describe('TechnicalIndicators', () => {
    let samplePrices, sampleHighs, sampleLows, sampleVolumes;

    beforeEach(() => {
        // Generate sample data for testing
        samplePrices = [];
        sampleHighs = [];
        sampleLows = [];
        sampleVolumes = [];
        
        let basePrice = 1.2000;
        for (let i = 0; i < 100; i++) {
            const change = (Math.random() - 0.5) * 0.002;
            basePrice *= (1 + change);
            
            const high = basePrice * (1 + Math.random() * 0.001);
            const low = basePrice * (1 - Math.random() * 0.001);
            
            samplePrices.push(basePrice);
            sampleHighs.push(high);
            sampleLows.push(low);
            sampleVolumes.push(Math.floor(Math.random() * 1000000 + 500000));
        }
    });

    describe('EMA Calculation', () => {
        test('should calculate EMA correctly', () => {
            const ema = TechnicalIndicators.calculateEMA(samplePrices, 12);
            
            expect(ema).toBeDefined();
            expect(ema.length).toBe(samplePrices.length);
            expect(ema[0]).toBe(samplePrices[0]);
            expect(typeof ema[ema.length - 1]).toBe('number');
        });

        test('should handle edge cases', () => {
            const shortPrices = [1.0, 1.1, 1.2];
            const ema = TechnicalIndicators.calculateEMA(shortPrices, 2);
            
            expect(ema.length).toBe(3);
            expect(ema[0]).toBe(1.0);
        });
    });

    describe('MACD Calculation', () => {
        test('should calculate MACD components', () => {
            const macd = TechnicalIndicators.calculateMACD(samplePrices);
            
            expect(macd.macd).toBeDefined();
            expect(macd.signal).toBeDefined();
            expect(macd.histogram).toBeDefined();
            
            expect(macd.macd.length).toBe(samplePrices.length);
            expect(macd.signal.length).toBe(samplePrices.length);
            expect(macd.histogram.length).toBe(samplePrices.length);
        });

        test('should have histogram as difference between MACD and signal', () => {
            const macd = TechnicalIndicators.calculateMACD(samplePrices);
            const lastIndex = macd.macd.length - 1;
            
            const expectedHistogram = macd.macd[lastIndex] - macd.signal[lastIndex];
            expect(macd.histogram[lastIndex]).toBeCloseTo(expectedHistogram, 6);
        });
    });

    describe('ADX Calculation', () => {
        test('should calculate ADX components', () => {
            const adx = TechnicalIndicators.calculateADX(sampleHighs, sampleLows, samplePrices);
            
            expect(adx.adx).toBeDefined();
            expect(adx.plusDI).toBeDefined();
            expect(adx.minusDI).toBeDefined();
            
            expect(adx.adx.length).toBeGreaterThan(0);
            expect(adx.plusDI.length).toBeGreaterThan(0);
            expect(adx.minusDI.length).toBeGreaterThan(0);
        });

        test('should have ADX values between 0 and 100', () => {
            const adx = TechnicalIndicators.calculateADX(sampleHighs, sampleLows, samplePrices);
            
            for (const value of adx.adx) {
                if (!isNaN(value)) {
                    expect(value).toBeGreaterThanOrEqual(0);
                    expect(value).toBeLessThanOrEqual(100);
                }
            }
        });
    });

    describe('Stochastic Calculation', () => {
        test('should calculate Stochastic oscillator', () => {
            const stoch = TechnicalIndicators.calculateStochastic(sampleHighs, sampleLows, samplePrices);
            
            expect(stoch.k).toBeDefined();
            expect(stoch.d).toBeDefined();
            expect(stoch.k.length).toBeGreaterThan(0);
            expect(stoch.d.length).toBeGreaterThan(0);
        });

        test('should have values between 0 and 100', () => {
            const stoch = TechnicalIndicators.calculateStochastic(sampleHighs, sampleLows, samplePrices);
            
            for (const value of stoch.k) {
                if (!isNaN(value)) {
                    expect(value).toBeGreaterThanOrEqual(0);
                    expect(value).toBeLessThanOrEqual(100);
                }
            }
        });
    });

    describe('CCI Calculation', () => {
        test('should calculate CCI', () => {
            const cci = TechnicalIndicators.calculateCCI(sampleHighs, sampleLows, samplePrices);
            
            expect(cci).toBeDefined();
            expect(cci.length).toBeGreaterThan(0);
            expect(typeof cci[0]).toBe('number');
        });
    });

    describe('Volume Indicators', () => {
        test('should calculate OBV', () => {
            const obv = TechnicalIndicators.calculateOBV(samplePrices, sampleVolumes);
            
            expect(obv).toBeDefined();
            expect(obv.length).toBe(samplePrices.length);
            expect(obv[0]).toBe(0);
        });

        test('should calculate MFI', () => {
            const mfi = TechnicalIndicators.calculateMFI(sampleHighs, sampleLows, samplePrices, sampleVolumes);
            
            expect(mfi).toBeDefined();
            expect(mfi.length).toBeGreaterThan(0);
            
            for (const value of mfi) {
                if (!isNaN(value)) {
                    expect(value).toBeGreaterThanOrEqual(0);
                    expect(value).toBeLessThanOrEqual(100);
                }
            }
        });
    });

    describe('Volatility Indicators', () => {
        test('should calculate ATR', () => {
            const atr = TechnicalIndicators.calculateATR(sampleHighs, sampleLows, samplePrices);
            
            expect(atr).toBeDefined();
            expect(atr.length).toBeGreaterThan(0);
            
            for (const value of atr) {
                expect(value).toBeGreaterThan(0);
            }
        });

        test('should calculate Keltner Channels', () => {
            const keltner = TechnicalIndicators.calculateKeltnerChannels(sampleHighs, sampleLows, samplePrices);
            
            expect(keltner.upper).toBeDefined();
            expect(keltner.middle).toBeDefined();
            expect(keltner.lower).toBeDefined();
            
            // Upper should be greater than middle, middle greater than lower
            for (let i = 0; i < keltner.upper.length; i++) {
                if (!isNaN(keltner.upper[i]) && !isNaN(keltner.middle[i]) && !isNaN(keltner.lower[i])) {
                    expect(keltner.upper[i]).toBeGreaterThan(keltner.middle[i]);
                    expect(keltner.middle[i]).toBeGreaterThan(keltner.lower[i]);
                }
            }
        });
    });

    describe('Pattern Recognition', () => {
        test('should identify price patterns', () => {
            const patterns = TechnicalIndicators.calculatePricePatterns(sampleHighs, sampleLows, samplePrices);
            
            expect(patterns).toBeDefined();
            expect(patterns.length).toBeGreaterThan(0);
            
            const validPatterns = ['DOUBLE_TOP', 'DOUBLE_BOTTOM', 'HEAD_AND_SHOULDERS', 'TRIANGLE', 'NONE'];
            for (const pattern of patterns) {
                expect(validPatterns).toContain(pattern);
            }
        });

        test('should identify market regimes', () => {
            const regimes = TechnicalIndicators.calculateMarketRegime(samplePrices, sampleVolumes);
            
            expect(regimes).toBeDefined();
            expect(regimes.length).toBeGreaterThan(0);
            
            const validRegimes = ['RANGE', 'UPTREND', 'DOWNTREND', 'VOLATILE', 'UNDEFINED'];
            for (const regime of regimes) {
                expect(validRegimes).toContain(regime);
            }
        });
    });

    describe('Helper Functions', () => {
        test('should find peaks correctly', () => {
            const testData = [1, 3, 2, 5, 1, 4, 2];
            const peaks = TechnicalIndicators.findPeaks(testData);
            
            expect(peaks).toContain(1); // Index of value 3
            expect(peaks).toContain(3); // Index of value 5
            expect(peaks).toContain(5); // Index of value 4
        });

        test('should find troughs correctly', () => {
            const testData = [3, 1, 4, 2, 5, 1, 3];
            const troughs = TechnicalIndicators.findTroughs(testData);
            
            expect(troughs).toContain(1); // Index of value 1
            expect(troughs).toContain(3); // Index of value 2
            expect(troughs).toContain(5); // Index of value 1
        });

        test('should calculate linear regression', () => {
            const testData = [1, 2, 3, 4, 5];
            const regression = TechnicalIndicators.linearRegression(testData);
            
            expect(regression.slope).toBeCloseTo(1, 1);
            expect(regression.intercept).toBeCloseTo(1, 1);
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty arrays', () => {
            expect(() => TechnicalIndicators.calculateEMA([], 12)).not.toThrow();
        });

        test('should handle single value arrays', () => {
            const singleValue = [1.2000];
            const ema = TechnicalIndicators.calculateEMA(singleValue, 12);
            
            expect(ema).toEqual([1.2000]);
        });

        test('should handle period longer than data', () => {
            const shortData = [1, 2, 3];
            const ema = TechnicalIndicators.calculateEMA(shortData, 10);
            
            expect(ema.length).toBe(3);
        });
    });
});

// Test runner function
function runTechnicalIndicatorTests() {
    console.log('Running Technical Indicators tests...');
    
    // Mock test framework
    global.describe = (name, fn) => {
        console.log(`\n--- ${name} ---`);
        fn();
    };
    
    global.test = (name, fn) => {
        try {
            if (global._beforeEach) global._beforeEach();
            fn();
            console.log(`✓ ${name}`);
        } catch (error) {
            console.log(`✗ ${name}: ${error.message}`);
        }
    };
    
    global.beforeEach = (fn) => {
        global._beforeEach = fn;
    };
    
    global.expect = (actual) => ({
        toBe: (expected) => {
            if (actual !== expected) {
                throw new Error(`Expected ${expected}, got ${actual}`);
            }
        },
        toEqual: (expected) => {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
            }
        },
        toBeDefined: () => {
            if (actual === undefined) {
                throw new Error('Expected value to be defined');
            }
        },
        toBeGreaterThan: (expected) => {
            if (actual <= expected) {
                throw new Error(`Expected ${actual} to be greater than ${expected}`);
            }
        },
        toBeGreaterThanOrEqual: (expected) => {
            if (actual < expected) {
                throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
            }
        },
        toBeLessThanOrEqual: (expected) => {
            if (actual > expected) {
                throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
            }
        },
        toBeCloseTo: (expected, precision = 2) => {
            const diff = Math.abs(actual - expected);
            const tolerance = Math.pow(10, -precision);
            if (diff > tolerance) {
                throw new Error(`Expected ${actual} to be close to ${expected}`);
            }
        },
        toContain: (expected) => {
            if (!actual.includes(expected)) {
                throw new Error(`Expected array to contain ${expected}`);
            }
        },
        not: {
            toThrow: () => {
                try {
                    if (typeof actual === 'function') actual();
                } catch (error) {
                    throw new Error('Expected function not to throw');
                }
            }
        }
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTechnicalIndicatorTests };
}