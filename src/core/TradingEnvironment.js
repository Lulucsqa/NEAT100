const TechnicalIndicators = require('../indicators/TechnicalIndicators');
const FundamentalAnalysis = require('../analysis/FundamentalAnalysis');
const DataProvider = require('../data/DataProvider');
const config = require('../config');

class TradingEnvironment {
    constructor(options = {}) {
        this.symbol = options.symbol || 'EURUSD';
        this.timeframe = options.timeframe || '5m';
        this.balance = options.initialBalance || 10000;
        this.initialBalance = this.balance;
        
        this.positions = [];
        this.trades = [];
        this.currentIndex = 0;
        
        // Componentes
        this.dataProvider = new DataProvider();
        this.technicalAnalysis = new TechnicalIndicators();
        this.fundamentalAnalysis = new FundamentalAnalysis();
        
        // Dados
        this.priceData = [];
        this.indicators = {};
        this.fundamentals = {};
        
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Carrega dados históricos
            this.priceData = await this.dataProvider.getHistoricalData(
                this.symbol, 
                this.timeframe,
                config.trading.backtesting.startDate,
                config.trading.backtesting.endDate
            );

            // Calcula indicadores técnicos
            await this.calculateTechnicalIndicators();
            
            // Carrega dados fundamentalistas
            await this.fundamentalAnalysis.initialize();
            
            this.isInitialized = true;
            console.log(`Environment initialized for ${this.symbol} with ${this.priceData.length} data points`);
        } catch (error) {
            console.error('Failed to initialize trading environment:', error);
            throw error;
        }
    }

    async calculateTechnicalIndicators() {
        const prices = this.priceData.map(d => d.close);
        const highs = this.priceData.map(d => d.high);
        const lows = this.priceData.map(d => d.low);
        const volumes = this.priceData.map(d => d.volume);

        this.indicators = {
            // Tendência
            macd: TechnicalIndicators.calculateMACD(prices),
            adx: TechnicalIndicators.calculateADX(highs, lows, prices),
            
            // Momentum
            stochastic: TechnicalIndicators.calculateStochastic(highs, lows, prices),
            cci: TechnicalIndicators.calculateCCI(highs, lows, prices),
            
            // Volume
            obv: TechnicalIndicators.calculateOBV(prices, volumes),
            mfi: TechnicalIndicators.calculateMFI(highs, lows, prices, volumes),
            
            // Volatilidade
            atr: TechnicalIndicators.calculateATR(highs, lows, prices),
            keltner: TechnicalIndicators.calculateKeltnerChannels(highs, lows, prices),
            
            // Padrões
            patterns: TechnicalIndicators.calculatePricePatterns(highs, lows, prices),
            regime: TechnicalIndicators.calculateMarketRegime(prices, volumes)
        };
    }

    getState(index = this.currentIndex) {
        if (!this.isInitialized || index < 50) {
            return null;
        }

        // Estado técnico
        const technicalState = this.getTechnicalState(index);
        
        // Estado fundamentalista
        const fundamentalState = this.getFundamentalState(index);
        
        // Estado da conta
        const accountState = this.getAccountState();

        return {
            ...technicalState,
            ...fundamentalState,
            ...accountState,
            timestamp: this.priceData[index].timestamp,
            currentPrice: this.priceData[index].close
        };
    }

    getTechnicalState(index) {
        return {
            // Preços normalizados (últimos 20 períodos)
            prices: this.priceData.slice(index - 19, index + 1)
                .map(d => d.close / this.priceData[index].close),
            
            // Indicadores principais
            macd: {
                value: this.indicators.macd.macd[index] || 0,
                signal: this.indicators.macd.signal[index] || 0,
                histogram: this.indicators.macd.histogram[index] || 0
            },
            
            adx: {
                value: this.indicators.adx.adx[index] || 0,
                plusDI: this.indicators.adx.plusDI[index] || 0,
                minusDI: this.indicators.adx.minusDI[index] || 0
            },
            
            stochastic: {
                k: this.indicators.stochastic.k[index] || 0,
                d: this.indicators.stochastic.d[index] || 0
            },
            
            cci: this.indicators.cci[index] || 0,
            mfi: this.indicators.mfi[index] || 0,
            atr: this.indicators.atr[index] || 0,
            
            // Padrões e regime
            pattern: this.encodePattern(this.indicators.patterns[index]),
            regime: this.encodeRegime(this.indicators.regime[index])
        };
    }

    getFundamentalState(index) {
        const timestamp = this.priceData[index].timestamp;
        return this.fundamentalAnalysis.getStateForTimestamp(timestamp);
    }

    getAccountState() {
        return {
            balance: this.balance / this.initialBalance, // Normalizado
            equity: this.calculateEquity() / this.initialBalance,
            drawdown: this.calculateDrawdown(),
            openPositions: this.positions.length,
            totalTrades: this.trades.length
        };
    }

    executeAction(action, index = this.currentIndex) {
        const currentPrice = this.priceData[index].close;
        const timestamp = this.priceData[index].timestamp;
        
        let reward = 0;
        let trade = null;

        switch (action) {
            case 0: // Buy
                if (this.canOpenPosition('long')) {
                    trade = this.openPosition('long', currentPrice, timestamp);
                    reward = this.calculateImmediateReward(trade);
                }
                break;
                
            case 1: // Sell
                if (this.canOpenPosition('short')) {
                    trade = this.openPosition('short', currentPrice, timestamp);
                    reward = this.calculateImmediateReward(trade);
                }
                break;
                
            case 2: // Hold/Close
                if (this.positions.length > 0) {
                    trade = this.closeAllPositions(currentPrice, timestamp);
                    reward = this.calculateCloseReward(trade);
                }
                break;
        }

        // Atualiza posições existentes
        this.updatePositions(currentPrice, timestamp);
        
        return {
            reward,
            trade,
            done: this.isEpisodeDone(index),
            info: this.getPerformanceMetrics()
        };
    }

    canOpenPosition(type) {
        const maxPositions = 3;
        const riskCheck = this.calculateDrawdown() < config.trading.riskManagement.maxDrawdown;
        
        return this.positions.length < maxPositions && 
               riskCheck && 
               this.balance > 1000;
    }

    openPosition(type, price, timestamp) {
        const riskAmount = this.balance * config.trading.riskManagement.maxRiskPerTrade;
        const volume = this.calculatePositionSize(riskAmount, price);
        
        const position = {
            id: Date.now(),
            type,
            entry: price,
            volume,
            timestamp,
            unrealizedPnL: 0
        };
        
        this.positions.push(position);
        
        return {
            type: 'open',
            direction: type,
            price,
            volume,
            timestamp
        };
    }

    closeAllPositions(price, timestamp) {
        const closedTrades = [];
        let totalPnL = 0;

        for (const position of this.positions) {
            const pnl = this.calculatePnL(position, price);
            totalPnL += pnl;
            
            closedTrades.push({
                type: 'close',
                direction: position.type,
                entry: position.entry,
                exit: price,
                volume: position.volume,
                pnl,
                duration: timestamp - position.timestamp,
                timestamp
            });
        }

        this.balance += totalPnL;
        this.trades.push(...closedTrades);
        this.positions = [];

        return closedTrades;
    }

    calculatePnL(position, currentPrice) {
        const priceDiff = position.type === 'long' 
            ? currentPrice - position.entry
            : position.entry - currentPrice;
            
        return priceDiff * position.volume;
    }

    calculatePositionSize(riskAmount, price) {
        // Implementa Kelly Criterion ou fixed fractional
        return Math.floor(riskAmount / price);
    }

    calculateEquity() {
        let equity = this.balance;
        const currentPrice = this.priceData[this.currentIndex]?.close || 0;
        
        for (const position of this.positions) {
            equity += this.calculatePnL(position, currentPrice);
        }
        
        return equity;
    }

    calculateDrawdown() {
        if (this.trades.length === 0) return 0;
        
        let peak = this.initialBalance;
        let maxDrawdown = 0;
        let runningBalance = this.initialBalance;
        
        for (const trade of this.trades) {
            runningBalance += trade.pnl || 0;
            if (runningBalance > peak) peak = runningBalance;
            
            const drawdown = (peak - runningBalance) / peak;
            maxDrawdown = Math.max(maxDrawdown, drawdown);
        }
        
        return maxDrawdown;
    }

    calculateImmediateReward(trade) {
        // Recompensa baseada em probabilidade de sucesso
        return 0.1; // Pequena recompensa por abrir posição
    }

    calculateCloseReward(trades) {
        if (!trades || trades.length === 0) return 0;
        
        const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        return totalPnL / this.initialBalance; // Recompensa normalizada
    }

    updatePositions(currentPrice, timestamp) {
        for (const position of this.positions) {
            position.unrealizedPnL = this.calculatePnL(position, currentPrice);
        }
    }

    isEpisodeDone(index) {
        return index >= this.priceData.length - 1 || 
               this.balance < this.initialBalance * 0.5 || // Stop loss
               this.calculateDrawdown() > config.trading.riskManagement.maxDrawdown;
    }

    getPerformanceMetrics() {
        const winningTrades = this.trades.filter(t => (t.pnl || 0) > 0);
        const losingTrades = this.trades.filter(t => (t.pnl || 0) < 0);
        
        return {
            totalTrades: this.trades.length,
            winRate: this.trades.length > 0 ? winningTrades.length / this.trades.length : 0,
            totalReturn: (this.calculateEquity() - this.initialBalance) / this.initialBalance,
            maxDrawdown: this.calculateDrawdown(),
            sharpeRatio: this.calculateSharpeRatio()
        };
    }

    calculateSharpeRatio() {
        if (this.trades.length < 2) return 0;
        
        const returns = this.trades.map(t => (t.pnl || 0) / this.initialBalance);
        const meanReturn = returns.reduce((a, b) => a + b) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);
        
        return stdDev > 0 ? meanReturn / stdDev : 0;
    }

    encodePattern(pattern) {
        const patterns = {
            'DOUBLE_TOP': 0.8,
            'DOUBLE_BOTTOM': -0.8,
            'HEAD_AND_SHOULDERS': 0.6,
            'TRIANGLE': 0.0,
            'NONE': 0.0
        };
        return patterns[pattern] || 0;
    }

    encodeRegime(regime) {
        const regimes = {
            'UPTREND': 0.8,
            'DOWNTREND': -0.8,
            'RANGE': 0.0,
            'VOLATILE': 0.4,
            'UNDEFINED': 0.0
        };
        return regimes[regime] || 0;
    }

    reset() {
        this.balance = this.initialBalance;
        this.positions = [];
        this.trades = [];
        this.currentIndex = 50; // Começa após período de warm-up
    }

    step() {
        this.currentIndex++;
        return this.currentIndex < this.priceData.length;
    }
}

module.exports = TradingEnvironment;