const { HYPERPARAMS, MarketProcessor } = require('./NeuralArchitecture');
const TechnicalIndicators = require('./TechnicalIndicators');
const FundamentalAnalysis = require('./FundamentalAnalysis');
const BacktestEngine = require('./BacktestEngine');
const tf = require('@tensorflow/tfjs-node');

class TradingEnvironment {
    constructor() {
        this.currentPrice = 0;
        this.historicalPrices = [];
        this.timeframe = '1h';  // Timeframe padrão
        this.symbol = 'EURUSD';
        this.balance = 10000;  // Saldo inicial
        this.positions = [];
        this.pipValue = 0.0001;
        this.spread = 2;  // Spread em pips
        this.lastUpdate = Date.now();
        
        // Configurações de risco
        this.maxLeverage = 100;
        this.marginRequirement = 0.01;  // 1%
        
        // Indicadores técnicos
        this.indicators = {
            sma: [],    // Simple Moving Average
            rsi: [],    // Relative Strength Index
            bb: {       // Bollinger Bands
                upper: [],
                middle: [],
                lower: []
            },
            macd: null,
            adx: null,
            stochastic: null,
            cci: null,
            obv: null,
            mfi: null,
            atr: null,
            keltner: null,
            patterns: []
        };
        
        // Configurações GAN
        this.gan = {
            generator: null,
            discriminator: null,
            realData: [],
            fakeData: []
        };
        
        // Adiciona processador de mercado neural
        this.marketProcessor = new MarketProcessor();
        
        // Estado do mercado
        this.marketState = {
            regime: null,
            volatility: 0,
            trend: 0,
            sentiment: {
                technical: 0,
                fundamental: 0,
                combined: 0
            }
        };
        
        // Novos componentes
        this.technicalIndicators = new TechnicalIndicators();
        this.fundamentalAnalysis = new FundamentalAnalysis();
        this.backtestEngine = new BacktestEngine();
        
        // Métricas avançadas
        this.metrics = {
            sharpeRatio: 0,
            maxDrawdown: 0,
            calmarRatio: 0,
            volatilityAnnualized: 0
        };
        
        this.initialize();
    }

    initialize() {
        // Carrega dados históricos
        this.loadHistoricalData();
        
        // Inicializa indicadores
        this.calculateIndicators();
        
        // Configura GAN
        this.setupGAN();
        
        // Inicializa métricas de mercado
        this.calculateMarketMetrics();
    }

    loadHistoricalData() {
        // Aqui você deve implementar a lógica para carregar dados reais do mercado
        // Por enquanto, vamos gerar dados sintéticos para teste
        const periods = 1000;
        let price = 1.2000;  // Preço inicial
        
        for (let i = 0; i < periods; i++) {
            // Simula movimento de preço com random walk
            price += (Math.random() - 0.5) * 0.0020;
            this.historicalPrices.push({
                timestamp: Date.now() - (periods - i) * 3600000,
                open: price,
                high: price * (1 + Math.random() * 0.001),
                low: price * (1 - Math.random() * 0.001),
                close: price,
                volume: Math.random() * 1000
            });
        }
        
        this.currentPrice = price;
    }

    calculateIndicators() {
        const prices = this.historicalPrices.map(p => p.close);
        
        // Calcula SMA de 20 períodos
        this.indicators.sma = this.calculateSMA(prices, 20);
        
        // Calcula RSI de 14 períodos
        this.indicators.rsi = this.calculateRSI(prices, 14);
        
        // Calcula Bollinger Bands (20,2)
        const bb = this.calculateBollingerBands(prices, 20, 2);
        this.indicators.bb = bb;
    }

    setupGAN() {
        // Aqui você implementaria a configuração da sua GAN
        // Por enquanto, vamos apenas definir a estrutura básica
        this.gan.generator = {
            predict: (noise) => {
                // Simula previsão do gerador
                return this.historicalPrices.map(p => p.close);
            }
        };
        
        this.gan.discriminator = {
            predict: (data) => {
                // Simula discriminação
                return Math.random();
            }
        };
    }

    calculateMarketMetrics() {
        const prices = this.historicalPrices.map(p => p.close);
        const returns = [];
        
        // Calcula retornos
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }
        
        // Volatilidade
        this.marketState.volatility = this.calculateVolatility(returns);
        
        // Tendência
        this.marketState.trend = this.calculateTrend(prices);
        
        // Sharpe Ratio
        const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const riskFreeRate = 0.02 / 252; // Taxa livre de risco diária
        this.metrics.sharpeRatio = (meanReturn - riskFreeRate) / this.marketState.volatility;
        
        // Maximum Drawdown
        this.metrics.maxDrawdown = this.calculateMaxDrawdown(prices);
        
        // Calmar Ratio
        this.metrics.calmarRatio = this.metrics.maxDrawdown !== 0 ? 
            meanReturn / this.metrics.maxDrawdown : 0;
            
        // Volatilidade Anualizada
        this.metrics.volatilityAnnualized = this.marketState.volatility * Math.sqrt(252);
    }

    calculateVolatility(returns) {
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
        return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / returns.length);
    }

    calculateTrend(prices) {
        const n = prices.length;
        if (n < 2) return 0;
        
        // Regressão linear simples
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += prices[i];
            sumXY += i * prices[i];
            sumX2 += i * i;
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }

    calculateMaxDrawdown(prices) {
        let maxDrawdown = 0;
        let peak = prices[0];
        
        for (let i = 1; i < prices.length; i++) {
            if (prices[i] > peak) {
                peak = prices[i];
            } else {
                const drawdown = (peak - prices[i]) / peak;
                maxDrawdown = Math.max(maxDrawdown, drawdown);
            }
        }
        
        return maxDrawdown;
    }

    async update() {
        // Atualiza preços e indicadores
        const now = Date.now();
        if (now - this.lastUpdate >= 1000) {  // Atualiza a cada segundo
            this.updatePrice();
            this.calculateIndicators();
            this.checkPositions();
            this.lastUpdate = now;
        }
        
        // Processa estado do mercado
        const priceData = this.historicalPrices.slice(-HYPERPARAMS.priceWindowSize)
            .map(p => [p.open, p.high, p.low, p.close, p.volume]);
            
        const technicalData = [
            this.indicators.sma,
            this.indicators.rsi,
            this.indicators.bb.upper,
            this.indicators.bb.lower,
            this.indicators.bb.middle
        ].map(ind => ind.slice(-HYPERPARAMS.priceWindowSize));
        
        // Atualiza regime de mercado
        this.marketState.regime = await this.marketProcessor.processMarketState(
            priceData,
            technicalData
        );
        
        // Atualiza métricas
        this.calculateMarketMetrics();
    }

    getState() {
        const currentIndex = this.historicalPrices.length - 1;
        
        return {
            price: this.currentPrice,
            sma: this.indicators.sma[currentIndex],
            rsi: this.indicators.rsi[currentIndex],
            bb: {
                upper: this.indicators.bb.upper[currentIndex],
                middle: this.indicators.bb.middle[currentIndex],
                lower: this.indicators.bb.lower[currentIndex]
            },
            balance: this.balance,
            positions: this.positions,
            timestamp: Date.now(),
            marketState: this.marketState.regime ? this.marketState.regime.dataSync() : null,
            volatility: this.marketState.volatility,
            trend: this.marketState.trend,
            metrics: this.metrics
        };
    }

    executeAction(action) {
        // Executa uma ação de trading e retorna a recompensa
        const { type, volume, stopLoss, takeProfit } = action;
        let reward = 0;
        
        switch(type) {
            case 'BUY':
                reward = this.openPosition('BUY', volume, stopLoss, takeProfit);
                break;
            case 'SELL':
                reward = this.openPosition('SELL', volume, stopLoss, takeProfit);
                break;
            case 'CLOSE':
                reward = this.closeAllPositions();
                break;
            case 'HOLD':
                reward = this.calculateHoldReward();
                break;
        }
        
        return reward;
    }

    openPosition(type, volume, stopLoss, takeProfit) {
        const position = {
            type: type,
            volume: volume,
            entryPrice: this.currentPrice,
            stopLoss: stopLoss,
            takeProfit: takeProfit,
            openTime: Date.now()
        };
        
        this.positions.push(position);
        
        // Calcula custo da posição
        const cost = volume * this.currentPrice * this.marginRequirement;
        this.balance -= cost;
        
        return -cost;  // Recompensa inicial é o custo negativo
    }

    closeAllPositions() {
        let totalProfit = 0;
        
        for (const position of this.positions) {
            const profit = this.calculatePositionProfit(position);
            totalProfit += profit;
        }
        
        this.balance += totalProfit;
        this.positions = [];
        
        return totalProfit;
    }

    calculatePositionProfit(position) {
        const priceDiff = position.type === 'BUY' ? 
            (this.currentPrice - position.entryPrice) :
            (position.entryPrice - this.currentPrice);
            
        return priceDiff * position.volume * (1/this.pipValue);
    }

    calculateHoldReward() {
        // Recompensa por manter posições abertas
        return this.positions.reduce((total, pos) => 
            total + this.calculatePositionProfit(pos), 0);
    }

    updatePrice() {
        // Simula movimento de preço
        const change = (Math.random() - 0.5) * 0.0002;
        this.currentPrice += change;
        
        this.historicalPrices.push({
            timestamp: Date.now(),
            open: this.currentPrice,
            high: this.currentPrice * (1 + Math.random() * 0.0001),
            low: this.currentPrice * (1 - Math.random() * 0.0001),
            close: this.currentPrice,
            volume: Math.random() * 1000
        });
        
        // Mantém apenas os últimos 1000 preços
        if (this.historicalPrices.length > 1000) {
            this.historicalPrices.shift();
        }
    }

    checkPositions() {
        // Verifica stop loss e take profit
        this.positions = this.positions.filter(position => {
            const profit = this.calculatePositionProfit(position);
            
            if (profit <= -position.stopLoss || profit >= position.takeProfit) {
                this.balance += profit;
                return false;
            }
            return true;
        });
    }

    // Funções auxiliares para cálculo de indicadores
    calculateSMA(prices, period) {
        const sma = [];
        for (let i = 0; i < prices.length; i++) {
            if (i < period - 1) {
                sma.push(null);
                continue;
            }
            
            const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            sma.push(sum / period);
        }
        return sma;
    }

    calculateRSI(prices, period) {
        const rsi = [];
        let gains = 0;
        let losses = 0;
        
        for (let i = 0; i < prices.length; i++) {
            if (i < period) {
                rsi.push(null);
                continue;
            }
            
            const change = prices[i] - prices[i-1];
            gains = (gains * (period - 1) + (change > 0 ? change : 0)) / period;
            losses = (losses * (period - 1) + (change < 0 ? -change : 0)) / period;
            
            const rs = gains / losses;
            rsi.push(100 - (100 / (1 + rs)));
        }
        
        return rsi;
    }

    calculateBollingerBands(prices, period, stdDev) {
        const bb = {
            upper: [],
            middle: [],
            lower: []
        };
        
        for (let i = 0; i < prices.length; i++) {
            if (i < period - 1) {
                bb.upper.push(null);
                bb.middle.push(null);
                bb.lower.push(null);
                continue;
            }
            
            const slice = prices.slice(i - period + 1, i + 1);
            const sma = slice.reduce((a, b) => a + b, 0) / period;
            
            const squareDiffs = slice.map(price => Math.pow(price - sma, 2));
            const variance = squareDiffs.reduce((a, b) => a + b, 0) / period;
            const std = Math.sqrt(variance);
            
            bb.middle.push(sma);
            bb.upper.push(sma + (stdDev * std));
            bb.lower.push(sma - (stdDev * std));
        }
        
        return bb;
    }

    calculateAllIndicators() {
        const prices = this.historicalPrices.map(p => p.close);
        const highs = this.historicalPrices.map(p => p.high);
        const lows = this.historicalPrices.map(p => p.low);
        const volumes = this.historicalPrices.map(p => p.volume);
        
        // Indicadores existentes
        this.calculateSMA(prices);
        this.calculateRSI(prices);
        this.calculateBollingerBands(prices);
        
        // Novos indicadores
        const macd = TechnicalIndicators.calculateMACD(prices);
        this.indicators.macd = {
            line: macd.macd.slice(-1)[0],
            signal: macd.signal.slice(-1)[0],
            histogram: macd.histogram.slice(-1)[0]
        };
        
        const adx = TechnicalIndicators.calculateADX(highs, lows, prices);
        this.indicators.adx = {
            value: adx.adx.slice(-1)[0],
            plusDI: adx.plusDI.slice(-1)[0],
            minusDI: adx.minusDI.slice(-1)[0]
        };
        
        const stoch = TechnicalIndicators.calculateStochastic(highs, lows, prices);
        this.indicators.stochastic = {
            k: stoch.k.slice(-1)[0],
            d: stoch.d.slice(-1)[0]
        };
        
        this.indicators.cci = TechnicalIndicators.calculateCCI(
            highs, lows, prices
        ).slice(-1)[0];
        
        this.indicators.obv = TechnicalIndicators.calculateOBV(
            prices, volumes
        ).slice(-1)[0];
        
        this.indicators.mfi = TechnicalIndicators.calculateMFI(
            highs, lows, prices, volumes
        ).slice(-1)[0];
        
        this.indicators.atr = TechnicalIndicators.calculateATR(
            highs, lows, prices
        ).slice(-1)[0];
        
        const keltner = TechnicalIndicators.calculateKeltnerChannels(
            highs, lows, prices
        );
        this.indicators.keltner = {
            upper: keltner.upper.slice(-1)[0],
            middle: keltner.middle.slice(-1)[0],
            lower: keltner.lower.slice(-1)[0]
        };
        
        this.indicators.patterns = TechnicalIndicators.calculatePricePatterns(
            highs, lows, prices
        ).slice(-1)[0];
    }

    analyzeMarketState() {
        // Análise técnica
        const technicalScore = this.calculateTechnicalScore();
        
        // Análise fundamentalista
        const fundamentalImpact = this.fundamentalAnalysis.calculateMarketImpact(
            this.symbol
        );
        
        // Combina análises
        this.marketState = {
            ...this.marketState,
            regime: this.determineMarketRegime(),
            sentiment: {
                technical: technicalScore,
                fundamental: fundamentalImpact.strength * 
                    (fundamentalImpact.bullish - fundamentalImpact.bearish),
                combined: (technicalScore + fundamentalImpact.strength) / 2
            }
        };
    }

    calculateTechnicalScore() {
        let score = 0;
        
        // MACD
        if (this.indicators.macd.histogram > 0) score += 1;
        if (this.indicators.macd.line > this.indicators.macd.signal) score += 1;
        
        // ADX
        if (this.indicators.adx.value > 25) {  // Tendência forte
            if (this.indicators.adx.plusDI > this.indicators.adx.minusDI) score += 2;
            else score -= 2;
        }
        
        // Estocástico
        if (this.indicators.stochastic.k > this.indicators.stochastic.d) score += 1;
        if (this.indicators.stochastic.k > 80) score -= 1;
        if (this.indicators.stochastic.k < 20) score += 1;
        
        // CCI
        if (this.indicators.cci > 100) score -= 1;
        if (this.indicators.cci < -100) score += 1;
        
        // MFI
        if (this.indicators.mfi > 80) score -= 1;
        if (this.indicators.mfi < 20) score += 1;
        
        // Keltner Channels
        const price = this.historicalPrices.slice(-1)[0].close;
        if (price > this.indicators.keltner.upper) score -= 1;
        if (price < this.indicators.keltner.lower) score += 1;
        
        // Normaliza para -1 a 1
        return score / 10;
    }

    determineMarketRegime() {
        if (this.marketState.volatility > 0.015) return 'VOLATILE';
        if (Math.abs(this.marketState.trend) < 0.001) return 'RANGE';
        if (this.marketState.trend > 0 && this.calculateVolumeProfile() > 0) return 'UPTREND';
        if (this.marketState.trend < 0 && this.calculateVolumeProfile() > 0) return 'DOWNTREND';
        return 'UNDEFINED';
    }

    calculateVolumeProfile() {
        const volumes = this.historicalPrices.slice(-20).map(p => p.volume);
        const avgVolume = volumes.reduce((a, b) => a + b) / volumes.length;
        
        return volumes.slice(-5).reduce((a, b) => a + b) / (5 * avgVolume) - 1;
    }

    async update() {
        // Atualização existente
        const now = Date.now();
        if (now - this.lastUpdate >= 1000) {  // Atualiza a cada segundo
            this.updatePrice();
            this.calculateIndicators();
            this.checkPositions();
            this.lastUpdate = now;
        }
        
        // Processa estado do mercado
        const priceData = this.historicalPrices.slice(-HYPERPARAMS.priceWindowSize)
            .map(p => [p.open, p.high, p.low, p.close, p.volume]);
            
        const technicalData = [
            this.indicators.sma,
            this.indicators.rsi,
            this.indicators.bb.upper,
            this.indicators.bb.lower,
            this.indicators.bb.middle
        ].map(ind => ind.slice(-HYPERPARAMS.priceWindowSize));
        
        // Atualiza regime de mercado
        this.marketState.regime = await this.marketProcessor.processMarketState(
            priceData,
            technicalData
        );
        
        // Atualiza métricas
        this.calculateMarketMetrics();
        
        // Atualiza indicadores e análises
        this.calculateAllIndicators();
        await this.fundamentalAnalysis.updateNewsData();
        this.analyzeMarketState();
    }

    getState() {
        const state = {
            price: this.currentPrice,
            sma: this.indicators.sma[this.indicators.sma.length - 1],
            rsi: this.indicators.rsi[this.indicators.rsi.length - 1],
            bb: {
                upper: this.indicators.bb.upper[this.indicators.bb.upper.length - 1],
                middle: this.indicators.bb.middle[this.indicators.bb.middle.length - 1],
                lower: this.indicators.bb.lower[this.indicators.bb.lower.length - 1]
            },
            balance: this.balance,
            positions: this.positions,
            timestamp: Date.now(),
            marketState: this.marketState.regime ? this.marketState.regime.dataSync() : null,
            volatility: this.marketState.volatility,
            trend: this.marketState.trend,
            metrics: this.metrics
        };
        
        return {
            ...state,
            indicators: this.indicators,
            marketState: this.marketState,
            fundamental: this.fundamentalAnalysis.getLatestData()
        };
    }

    async runBacktest(agent, config) {
        return await this.backtestEngine.runBacktest(agent, {
            ...config,
            symbol: this.symbol,
            timeframe: this.timeframe
        });
    }

    dispose() {
        this.marketProcessor.dispose();
        tf.dispose([this.marketState.regime]);
    }
}

module.exports = TradingEnvironment;
