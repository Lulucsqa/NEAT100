const TechnicalIndicators = require('./TechnicalIndicators');
const tf = require('@tensorflow/tfjs-node');

class BacktestEngine {
    constructor() {
        this.historicalData = [];
        this.fundamentalData = {};
        this.results = {
            trades: [],
            metrics: {},
            equity: []
        };
    }

    async loadHistoricalData(symbol, timeframe, startDate, endDate) {
        // Aqui você implementaria a conexão com sua fonte de dados
        // Por exemplo, Alpha Vantage, Yahoo Finance, etc.
        this.historicalData = await this.fetchHistoricalData(symbol, timeframe, startDate, endDate);
        this.fundamentalData = await this.fetchFundamentalData(symbol);
    }

    async fetchHistoricalData(symbol, timeframe, startDate, endDate) {
        // Implementar conexão com API de dados
        // Por enquanto, gerando dados sintéticos
        const data = [];
        let currentPrice = 1.2000;
        const periods = Math.floor((endDate - startDate) / this.getTimeframeMinutes(timeframe));

        for (let i = 0; i < periods; i++) {
            const change = (Math.random() - 0.5) * 0.002;
            currentPrice *= (1 + change);

            data.push({
                timestamp: new Date(startDate.getTime() + i * this.getTimeframeMinutes(timeframe) * 60000),
                open: currentPrice * (1 + (Math.random() - 0.5) * 0.0005),
                high: currentPrice * (1 + Math.random() * 0.001),
                low: currentPrice * (1 - Math.random() * 0.001),
                close: currentPrice,
                volume: Math.floor(Math.random() * 1000000)
            });
        }

        return data;
    }

    async fetchFundamentalData(symbol) {
        // Implementar conexão com API de dados fundamentalistas
        // Por enquanto, retornando dados simulados
        return {
            economicCalendar: this.generateEconomicCalendar(),
            interestRates: this.generateInterestRates(),
            marketSentiment: this.generateMarketSentiment()
        };
    }

    generateEconomicCalendar() {
        const events = [
            'GDP', 'CPI', 'NFP', 'Interest Rate Decision',
            'Retail Sales', 'PMI', 'Trade Balance'
        ];

        const impacts = ['High', 'Medium', 'Low'];
        const calendar = [];

        for (let i = 0; i < 100; i++) {
            calendar.push({
                date: new Date(Date.now() + i * 86400000),
                event: events[Math.floor(Math.random() * events.length)],
                impact: impacts[Math.floor(Math.random() * impacts.length)],
                forecast: Math.random() * 2 - 1,
                previous: Math.random() * 2 - 1
            });
        }

        return calendar;
    }

    generateInterestRates() {
        const rates = [];
        let rate = 2.5;

        for (let i = 0; i < 24; i++) {
            rate += (Math.random() - 0.5) * 0.1;
            rates.push({
                date: new Date(Date.now() - i * 30 * 86400000),
                rate: Math.max(0, rate)
            });
        }

        return rates;
    }

    generateMarketSentiment() {
        return {
            bullish: Math.random() * 100,
            bearish: Math.random() * 100,
            neutral: Math.random() * 100
        };
    }

    getTimeframeMinutes(timeframe) {
        const timeframes = {
            '1m': 1,
            '5m': 5,
            '15m': 15,
            '30m': 30,
            '1h': 60,
            '4h': 240,
            '1d': 1440
        };
        return timeframes[timeframe] || 1;
    }

    async runBacktest(agent, config) {
        this.results = {
            trades: [],
            metrics: {},
            equity: [config.initialBalance]
        };

        let balance = config.initialBalance;
        let positions = [];

        // Calcula indicadores técnicos
        const prices = this.historicalData.map(d => d.close);
        const highs = this.historicalData.map(d => d.high);
        const lows = this.historicalData.map(d => d.low);
        const volumes = this.historicalData.map(d => d.volume);

        const indicators = {
            macd: TechnicalIndicators.calculateMACD(prices),
            adx: TechnicalIndicators.calculateADX(highs, lows, prices),
            stoch: TechnicalIndicators.calculateStochastic(highs, lows, prices),
            mfi: TechnicalIndicators.calculateMFI(highs, lows, prices, volumes),
            patterns: TechnicalIndicators.calculatePricePatterns(highs, lows, prices)
        };

        // Executa backtest
        for (let i = 50; i < this.historicalData.length; i++) {
            const state = this.prepareState(i, indicators);
            const fundamentals = this.prepareFundamentals(this.historicalData[i].timestamp);
            
            // Decisão do agente
            const action = await agent.think({
                ...state,
                fundamentals,
                balance,
                positions
            });

            // Executa ação
            const result = this.executeAction(action, i, positions, balance, config);
            positions = result.positions;
            balance = result.balance;

            // Registra resultado
            this.results.equity.push(balance);
            if (result.trade) {
                this.results.trades.push(result.trade);
            }
        }

        // Calcula métricas finais
        this.calculateMetrics();
        return this.results;
    }

    prepareState(index, indicators) {
        const window = this.historicalData.slice(index - 50, index + 1);
        
        return {
            ohlcv: window.map(d => ({
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
                volume: d.volume,
                timestamp: d.timestamp
            })),
            indicators: {
                macd: {
                    value: indicators.macd.macd[index],
                    signal: indicators.macd.signal[index],
                    histogram: indicators.macd.histogram[index]
                },
                adx: {
                    value: indicators.adx.adx[index],
                    plusDI: indicators.adx.plusDI[index],
                    minusDI: indicators.adx.minusDI[index]
                },
                stochastic: {
                    k: indicators.stoch.k[index],
                    d: indicators.stoch.d[index]
                },
                mfi: indicators.mfi[index],
                pattern: indicators.patterns[index]
            }
        };
    }

    prepareFundamentals(timestamp) {
        // Encontra eventos econômicos próximos
        const events = this.fundamentalData.economicCalendar
            .filter(e => Math.abs(e.date - timestamp) < 86400000);

        // Encontra taxa de juros atual
        const currentRate = this.fundamentalData.interestRates
            .find(r => r.date <= timestamp)?.rate || 0;

        return {
            events,
            interestRate: currentRate,
            sentiment: this.fundamentalData.marketSentiment
        };
    }

    executeAction(action, index, positions, balance, config) {
        const currentPrice = this.historicalData[index].close;
        const newPositions = [...positions];
        let newBalance = balance;
        let trade = null;

        if (action === 'buy' && balance > config.minTradeAmount) {
            const volume = Math.min(
                balance * config.riskPerTrade,
                config.maxTradeAmount
            ) / currentPrice;

            newPositions.push({
                type: 'long',
                entry: currentPrice,
                volume,
                timestamp: this.historicalData[index].timestamp
            });

            trade = {
                type: 'buy',
                price: currentPrice,
                volume,
                timestamp: this.historicalData[index].timestamp
            };
        }
        else if (action === 'sell' && positions.length > 0) {
            const position = positions[0];
            const profit = (currentPrice - position.entry) * position.volume;
            newBalance += profit;

            trade = {
                type: 'sell',
                price: currentPrice,
                volume: position.volume,
                profit,
                timestamp: this.historicalData[index].timestamp
            };

            newPositions.shift();
        }

        return {
            positions: newPositions,
            balance: newBalance,
            trade
        };
    }

    calculateMetrics() {
        const trades = this.results.trades;
        const profits = trades.filter(t => t.profit > 0);
        const losses = trades.filter(t => t.profit < 0);

        // Métricas básicas
        this.results.metrics = {
            totalTrades: trades.length,
            winRate: profits.length / trades.length,
            profitFactor: profits.reduce((sum, t) => sum + t.profit, 0) /
                         Math.abs(losses.reduce((sum, t) => sum + t.profit, 0)),
            averageProfit: profits.reduce((sum, t) => sum + t.profit, 0) / profits.length,
            averageLoss: losses.reduce((sum, t) => sum + t.profit, 0) / losses.length,
            maxDrawdown: this.calculateMaxDrawdown(this.results.equity),
            sharpeRatio: this.calculateSharpeRatio(this.results.equity),
            sortinoRatio: this.calculateSortinoRatio(this.results.equity)
        };
    }

    calculateMaxDrawdown(equity) {
        let maxDrawdown = 0;
        let peak = equity[0];

        for (const value of equity) {
            if (value > peak) {
                peak = value;
            }
            const drawdown = (peak - value) / peak;
            maxDrawdown = Math.max(maxDrawdown, drawdown);
        }

        return maxDrawdown;
    }

    calculateSharpeRatio(equity) {
        const returns = equity.slice(1).map((v, i) => (v - equity[i]) / equity[i]);
        const meanReturn = returns.reduce((a, b) => a + b) / returns.length;
        const stdDev = Math.sqrt(
            returns.map(r => Math.pow(r - meanReturn, 2))
                   .reduce((a, b) => a + b) / returns.length
        );

        return meanReturn / stdDev * Math.sqrt(252);  // Anualizado
    }

    calculateSortinoRatio(equity) {
        const returns = equity.slice(1).map((v, i) => (v - equity[i]) / equity[i]);
        const meanReturn = returns.reduce((a, b) => a + b) / returns.length;
        
        const negativeReturns = returns.filter(r => r < 0);
        const downside = Math.sqrt(
            negativeReturns.map(r => Math.pow(r - meanReturn, 2))
                          .reduce((a, b) => a + b) / negativeReturns.length
        );

        return meanReturn / downside * Math.sqrt(252);  // Anualizado
    }
}

module.exports = BacktestEngine;
