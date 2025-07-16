// Script para executar backtests independentes
const TradingEnvironment = require('../src/core/TradingEnvironment');
const BacktestEngine = require('../BacktestEngine');
const config = require('../src/config');

class BacktestRunner {
    constructor() {
        this.results = [];
    }

    async runSingleBacktest(symbol, timeframe, startDate, endDate) {
        console.log(`\n🔄 Running backtest for ${symbol} (${timeframe})`);
        console.log(`📅 Period: ${startDate} to ${endDate}`);
        
        try {
            const environment = new TradingEnvironment({
                symbol,
                timeframe,
                initialBalance: config.trading.backtesting.initialBalance
            });
            
            await environment.initialize();
            
            // Simulate a simple strategy for testing
            const strategy = new SimpleMovingAverageStrategy();
            const result = await this.runStrategyBacktest(environment, strategy);
            
            this.results.push({
                symbol,
                timeframe,
                startDate,
                endDate,
                ...result
            });
            
            this.printBacktestResult(result);
            return result;
            
        } catch (error) {
            console.error(`❌ Backtest failed for ${symbol}:`, error.message);
            return null;
        }
    }

    async runStrategyBacktest(environment, strategy) {
        const trades = [];
        let balance = environment.initialBalance;
        let positions = [];
        let maxDrawdown = 0;
        let peak = balance;
        
        environment.reset();
        
        while (environment.step()) {
            const state = environment.getState();
            if (!state) continue;
            
            // Get strategy decision
            const decision = strategy.getDecision(state);
            
            // Execute decision
            const result = environment.executeAction(decision);
            
            if (result.trade) {
                trades.push(result.trade);
            }
            
            // Update balance and drawdown
            balance = environment.balance;
            if (balance > peak) peak = balance;
            
            const currentDrawdown = (peak - balance) / peak;
            maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
        }
        
        // Calculate final metrics
        const finalBalance = environment.balance;
        const totalReturn = (finalBalance - environment.initialBalance) / environment.initialBalance;
        const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
        const winRate = trades.length > 0 ? winningTrades.length / trades.length : 0;
        
        const returns = trades.map(t => (t.pnl || 0) / environment.initialBalance);
        const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b) / returns.length : 0;
        const returnStd = returns.length > 1 ? Math.sqrt(
            returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)
        ) : 0;
        const sharpeRatio = returnStd > 0 ? avgReturn / returnStd * Math.sqrt(252) : 0;
        
        return {
            initialBalance: environment.initialBalance,
            finalBalance,
            totalReturn,
            totalTrades: trades.length,
            winRate,
            maxDrawdown,
            sharpeRatio,
            trades: trades.slice(-10) // Keep last 10 trades for analysis
        };
    }

    printBacktestResult(result) {
        console.log('📊 Backtest Results:');
        console.log(`   💰 Initial Balance: $${result.initialBalance.toFixed(2)}`);
        console.log(`   💰 Final Balance: $${result.finalBalance.toFixed(2)}`);
        console.log(`   📈 Total Return: ${(result.totalReturn * 100).toFixed(2)}%`);
        console.log(`   🎯 Win Rate: ${(result.winRate * 100).toFixed(1)}%`);
        console.log(`   📉 Max Drawdown: ${(result.maxDrawdown * 100).toFixed(2)}%`);
        console.log(`   📊 Sharpe Ratio: ${result.sharpeRatio.toFixed(3)}`);
        console.log(`   🔄 Total Trades: ${result.totalTrades}`);
    }

    async runMultipleBacktests() {
        console.log('🚀 Running Multiple Backtests...\n');
        
        const testConfigs = [
            { symbol: 'EURUSD', timeframe: '5m', startDate: '2023-01-01', endDate: '2023-06-30' },
            { symbol: 'EURUSD', timeframe: '15m', startDate: '2023-01-01', endDate: '2023-06-30' },
            { symbol: 'GBPUSD', timeframe: '5m', startDate: '2023-01-01', endDate: '2023-06-30' },
            { symbol: 'USDJPY', timeframe: '5m', startDate: '2023-01-01', endDate: '2023-06-30' }
        ];
        
        for (const config of testConfigs) {
            await this.runSingleBacktest(
                config.symbol,
                config.timeframe,
                config.startDate,
                config.endDate
            );
        }
        
        this.printSummary();
    }

    printSummary() {
        if (this.results.length === 0) {
            console.log('❌ No backtest results to summarize');
            return;
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📋 BACKTEST SUMMARY');
        console.log('='.repeat(60));
        
        const avgReturn = this.results.reduce((sum, r) => sum + r.totalReturn, 0) / this.results.length;
        const avgWinRate = this.results.reduce((sum, r) => sum + r.winRate, 0) / this.results.length;
        const avgSharpe = this.results.reduce((sum, r) => sum + r.sharpeRatio, 0) / this.results.length;
        const maxDrawdown = Math.max(...this.results.map(r => r.maxDrawdown));
        
        console.log(`📊 Average Return: ${(avgReturn * 100).toFixed(2)}%`);
        console.log(`🎯 Average Win Rate: ${(avgWinRate * 100).toFixed(1)}%`);
        console.log(`📈 Average Sharpe Ratio: ${avgSharpe.toFixed(3)}`);
        console.log(`📉 Maximum Drawdown: ${(maxDrawdown * 100).toFixed(2)}%`);
        
        // Best and worst performers
        const bestResult = this.results.reduce((best, current) => 
            current.totalReturn > best.totalReturn ? current : best
        );
        
        const worstResult = this.results.reduce((worst, current) => 
            current.totalReturn < worst.totalReturn ? current : worst
        );
        
        console.log(`\n🏆 Best Performer: ${bestResult.symbol} (${bestResult.timeframe}) - ${(bestResult.totalReturn * 100).toFixed(2)}%`);
        console.log(`📉 Worst Performer: ${worstResult.symbol} (${worstResult.timeframe}) - ${(worstResult.totalReturn * 100).toFixed(2)}%`);
    }

    exportResults(filename = 'backtest_results.json') {
        const fs = require('fs');
        const exportData = {
            timestamp: new Date().toISOString(),
            results: this.results,
            summary: {
                totalBacktests: this.results.length,
                avgReturn: this.results.reduce((sum, r) => sum + r.totalReturn, 0) / this.results.length,
                avgWinRate: this.results.reduce((sum, r) => sum + r.winRate, 0) / this.results.length,
                avgSharpe: this.results.reduce((sum, r) => sum + r.sharpeRatio, 0) / this.results.length
            }
        };
        
        fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
        console.log(`\n💾 Results exported to ${filename}`);
    }
}

// Simple Moving Average Strategy for testing
class SimpleMovingAverageStrategy {
    constructor() {
        this.shortPeriod = 10;
        this.longPeriod = 20;
        this.priceHistory = [];
    }

    getDecision(state) {
        this.priceHistory.push(state.currentPrice);
        
        if (this.priceHistory.length < this.longPeriod) {
            return 2; // Hold
        }
        
        // Keep only necessary history
        if (this.priceHistory.length > this.longPeriod + 10) {
            this.priceHistory = this.priceHistory.slice(-this.longPeriod - 10);
        }
        
        const shortMA = this.calculateMA(this.shortPeriod);
        const longMA = this.calculateMA(this.longPeriod);
        
        // Simple crossover strategy
        if (shortMA > longMA && state.openPositions === 0) {
            return 0; // Buy
        } else if (shortMA < longMA && state.openPositions > 0) {
            return 2; // Close positions
        }
        
        return 2; // Hold
    }

    calculateMA(period) {
        const slice = this.priceHistory.slice(-period);
        return slice.reduce((sum, price) => sum + price, 0) / slice.length;
    }
}

// Run if called directly
if (require.main === module) {
    const runner = new BacktestRunner();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    
    if (args.length >= 4) {
        // Single backtest
        const [symbol, timeframe, startDate, endDate] = args;
        runner.runSingleBacktest(symbol, timeframe, startDate, endDate)
            .then(() => {
                if (args.includes('--export')) {
                    runner.exportResults();
                }
            })
            .catch(console.error);
    } else {
        // Multiple backtests
        runner.runMultipleBacktests()
            .then(() => {
                if (args.includes('--export')) {
                    runner.exportResults();
                }
            })
            .catch(console.error);
    }
}

module.exports = BacktestRunner;