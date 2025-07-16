const TradingEnvironment = require('../core/TradingEnvironment');
const config = require('../config');

describe('TradingEnvironment', () => {
    let environment;

    beforeEach(async () => {
        environment = new TradingEnvironment({
            symbol: 'EURUSD',
            timeframe: '5m',
            initialBalance: 10000
        });
    });

    describe('Initialization', () => {
        test('should initialize with correct default values', () => {
            expect(environment.symbol).toBe('EURUSD');
            expect(environment.timeframe).toBe('5m');
            expect(environment.balance).toBe(10000);
            expect(environment.initialBalance).toBe(10000);
            expect(environment.positions).toEqual([]);
            expect(environment.trades).toEqual([]);
        });

        test('should initialize with synthetic data when APIs fail', async () => {
            await environment.initialize();
            
            expect(environment.isInitialized).toBe(true);
            expect(environment.priceData.length).toBeGreaterThan(0);
            expect(environment.indicators).toBeDefined();
        });
    });

    describe('State Management', () => {
        beforeEach(async () => {
            await environment.initialize();
            environment.currentIndex = 100; // Set to valid index
        });

        test('should return valid state', () => {
            const state = environment.getState();
            
            expect(state).toBeDefined();
            expect(state.currentPrice).toBeGreaterThan(0);
            expect(state.balance).toBeDefined();
            expect(state.macd).toBeDefined();
            expect(state.adx).toBeDefined();
        });

        test('should return null for invalid index', () => {
            environment.currentIndex = 10; // Too early
            const state = environment.getState();
            
            expect(state).toBeNull();
        });
    });

    describe('Trading Actions', () => {
        beforeEach(async () => {
            await environment.initialize();
            environment.currentIndex = 100;
        });

        test('should execute buy action', () => {
            const initialBalance = environment.balance;
            const result = environment.executeAction(0); // Buy
            
            expect(result).toBeDefined();
            expect(result.reward).toBeDefined();
            
            if (result.trade) {
                expect(result.trade.type).toBe('open');
                expect(result.trade.direction).toBe('long');
                expect(environment.positions.length).toBe(1);
            }
        });

        test('should execute sell action', () => {
            const result = environment.executeAction(1); // Sell
            
            expect(result).toBeDefined();
            expect(result.reward).toBeDefined();
            
            if (result.trade) {
                expect(result.trade.type).toBe('open');
                expect(result.trade.direction).toBe('short');
                expect(environment.positions.length).toBe(1);
            }
        });

        test('should close positions on hold action', () => {
            // First open a position
            environment.executeAction(0); // Buy
            const positionsCount = environment.positions.length;
            
            if (positionsCount > 0) {
                const result = environment.executeAction(2); // Hold/Close
                
                expect(result.trade).toBeDefined();
                expect(environment.positions.length).toBe(0);
                expect(environment.trades.length).toBeGreaterThan(0);
            }
        });
    });

    describe('Risk Management', () => {
        beforeEach(async () => {
            await environment.initialize();
            environment.currentIndex = 100;
        });

        test('should respect maximum positions limit', () => {
            // Try to open more positions than allowed
            for (let i = 0; i < 5; i++) {
                environment.executeAction(0); // Buy
            }
            
            expect(environment.positions.length).toBeLessThanOrEqual(3);
        });

        test('should prevent trading when balance is too low', () => {
            environment.balance = 500; // Below minimum
            const result = environment.executeAction(0); // Buy
            
            expect(result.trade).toBeNull();
        });

        test('should calculate drawdown correctly', () => {
            // Add some losing trades
            environment.trades = [
                { pnl: -100 },
                { pnl: -200 },
                { pnl: 50 },
                { pnl: -150 }
            ];
            
            const drawdown = environment.calculateDrawdown();
            expect(drawdown).toBeGreaterThan(0);
            expect(drawdown).toBeLessThanOrEqual(1);
        });
    });

    describe('Performance Metrics', () => {
        beforeEach(async () => {
            await environment.initialize();
            environment.currentIndex = 100;
            
            // Add sample trades
            environment.trades = [
                { pnl: 100, timestamp: new Date() },
                { pnl: -50, timestamp: new Date() },
                { pnl: 200, timestamp: new Date() },
                { pnl: -75, timestamp: new Date() }
            ];
        });

        test('should calculate win rate correctly', () => {
            const metrics = environment.getPerformanceMetrics();
            
            expect(metrics.winRate).toBe(0.5); // 2 wins out of 4 trades
            expect(metrics.totalTrades).toBe(4);
        });

        test('should calculate total return correctly', () => {
            const metrics = environment.getPerformanceMetrics();
            const expectedReturn = (100 - 50 + 200 - 75) / 10000; // 175/10000
            
            expect(metrics.totalReturn).toBeCloseTo(expectedReturn, 4);
        });

        test('should calculate Sharpe ratio', () => {
            const sharpe = environment.calculateSharpeRatio();
            
            expect(typeof sharpe).toBe('number');
            expect(sharpe).not.toBeNaN();
        });
    });

    describe('Pattern and Regime Encoding', () => {
        test('should encode patterns correctly', () => {
            expect(environment.encodePattern('DOUBLE_TOP')).toBe(0.8);
            expect(environment.encodePattern('DOUBLE_BOTTOM')).toBe(-0.8);
            expect(environment.encodePattern('NONE')).toBe(0.0);
        });

        test('should encode regimes correctly', () => {
            expect(environment.encodeRegime('UPTREND')).toBe(0.8);
            expect(environment.encodeRegime('DOWNTREND')).toBe(-0.8);
            expect(environment.encodeRegime('RANGE')).toBe(0.0);
        });
    });

    describe('Environment Reset', () => {
        beforeEach(async () => {
            await environment.initialize();
            environment.currentIndex = 100;
            
            // Make some trades
            environment.executeAction(0);
            environment.executeAction(2);
        });

        test('should reset environment correctly', () => {
            environment.reset();
            
            expect(environment.balance).toBe(environment.initialBalance);
            expect(environment.positions).toEqual([]);
            expect(environment.trades).toEqual([]);
            expect(environment.currentIndex).toBe(50);
        });
    });
});

// Helper function to run tests
function runTests() {
    console.log('Running TradingEnvironment tests...');
    
    // Mock test framework functions
    global.describe = (name, fn) => {
        console.log(`\n--- ${name} ---`);
        fn();
    };
    
    global.test = (name, fn) => {
        try {
            fn();
            console.log(`✓ ${name}`);
        } catch (error) {
            console.log(`✗ ${name}: ${error.message}`);
        }
    };
    
    global.beforeEach = (fn) => {
        // Store setup function
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
        toBeNull: () => {
            if (actual !== null) {
                throw new Error(`Expected null, got ${actual}`);
            }
        },
        not: {
            toBeNaN: () => {
                if (isNaN(actual)) {
                    throw new Error('Expected value not to be NaN');
                }
            }
        }
    });
}

// Export for use with real test frameworks
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTests };
}