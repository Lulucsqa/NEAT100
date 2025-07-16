// Test runner para todos os testes do sistema
const { runTests: runTradingTests } = require('./TradingEnvironment.test.js');
const { runTechnicalIndicatorTests } = require('./TechnicalIndicators.test.js');

async function runAllTests() {
    console.log('🧪 NEAT Trading System - Test Suite');
    console.log('=====================================\n');
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    // Mock global test functions
    const originalConsoleLog = console.log;
    const testResults = [];
    
    global.describe = (name, fn) => {
        console.log(`\n📋 ${name}`);
        console.log('─'.repeat(name.length + 4));
        fn();
    };
    
    global.test = (name, fn) => {
        totalTests++;
        try {
            if (global._beforeEach) global._beforeEach();
            fn();
            console.log(`✅ ${name}`);
            passedTests++;
            testResults.push({ name, status: 'PASS' });
        } catch (error) {
            console.log(`❌ ${name}`);
            console.log(`   Error: ${error.message}`);
            failedTests++;
            testResults.push({ name, status: 'FAIL', error: error.message });
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
        toBeNull: () => {
            if (actual !== null) {
                throw new Error(`Expected null, got ${actual}`);
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
            },
            toBeNaN: () => {
                if (isNaN(actual)) {
                    throw new Error('Expected value not to be NaN');
                }
            }
        }
    });
    
    try {
        // Run Trading Environment Tests
        console.log('🏪 Running Trading Environment Tests...');
        await runTradingTests();
        
        console.log('\n📊 Running Technical Indicators Tests...');
        await runTechnicalIndicatorTests();
        
        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('📈 TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${failedTests}`);
        console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\n🔍 Failed Tests:');
            testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
        }
        
        console.log('\n' + (failedTests === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed.'));
        
        // Exit with appropriate code
        process.exit(failedTests === 0 ? 0 : 1);
        
    } catch (error) {
        console.error('\n💥 Test runner error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runAllTests();
}

module.exports = { runAllTests };