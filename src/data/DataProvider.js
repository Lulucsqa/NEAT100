const axios = require('axios');
const config = require('../config');

class DataProvider {
    constructor() {
        this.cache = new Map();
        this.apiKeys = config.data.apiKeys;
        this.rateLimits = new Map();
    }

    async getHistoricalData(symbol, timeframe, startDate, endDate) {
        const cacheKey = `${symbol}_${timeframe}_${startDate}_${endDate}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            let data;
            
            switch (config.data.providers.forex) {
                case 'alpha_vantage':
                    data = await this.fetchFromAlphaVantage(symbol, timeframe);
                    break;
                case 'yahoo_finance':
                    data = await this.fetchFromYahoo(symbol, timeframe, startDate, endDate);
                    break;
                default:
                    data = this.generateSyntheticData(symbol, timeframe, startDate, endDate);
            }

            // Filtra por período
            const filtered = this.filterByDateRange(data, startDate, endDate);
            
            // Cache por 1 hora
            this.cache.set(cacheKey, filtered);
            setTimeout(() => this.cache.delete(cacheKey), 3600000);
            
            return filtered;
        } catch (error) {
            console.warn(`Failed to fetch real data for ${symbol}, using synthetic data:`, error.message);
            return this.generateSyntheticData(symbol, timeframe, startDate, endDate);
        }
    }

    async fetchFromAlphaVantage(symbol, timeframe) {
        if (!this.apiKeys.alphaVantage) {
            throw new Error('Alpha Vantage API key not configured');
        }

        await this.checkRateLimit('alpha_vantage');

        const functionMap = {
            '1m': 'TIME_SERIES_INTRADAY',
            '5m': 'TIME_SERIES_INTRADAY',
            '15m': 'TIME_SERIES_INTRADAY',
            '30m': 'TIME_SERIES_INTRADAY',
            '1h': 'TIME_SERIES_INTRADAY',
            '1d': 'TIME_SERIES_DAILY'
        };

        const interval = timeframe === '1d' ? null : timeframe;
        const func = functionMap[timeframe] || 'TIME_SERIES_INTRADAY';

        const params = {
            function: func,
            symbol: symbol,
            apikey: this.apiKeys.alphaVantage,
            outputsize: 'full',
            datatype: 'json'
        };

        if (interval) {
            params.interval = interval;
        }

        const response = await axios.get('https://www.alphavantage.co/query', { params });
        
        if (response.data['Error Message']) {
            throw new Error(response.data['Error Message']);
        }

        return this.parseAlphaVantageData(response.data, timeframe);
    }

    parseAlphaVantageData(data, timeframe) {
        const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
        
        if (!timeSeriesKey) {
            throw new Error('Invalid Alpha Vantage response format');
        }

        const timeSeries = data[timeSeriesKey];
        const parsed = [];

        for (const [timestamp, values] of Object.entries(timeSeries)) {
            parsed.push({
                timestamp: new Date(timestamp),
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseInt(values['5. volume'] || '1000000')
            });
        }

        return parsed.sort((a, b) => a.timestamp - b.timestamp);
    }

    async fetchFromYahoo(symbol, timeframe, startDate, endDate) {
        // Implementação usando yfinance via Python subprocess ou API alternativa
        const yahooSymbol = this.convertToYahooSymbol(symbol);
        
        // Por enquanto, retorna dados sintéticos
        return this.generateSyntheticData(symbol, timeframe, startDate, endDate);
    }

    convertToYahooSymbol(symbol) {
        const mapping = {
            'EURUSD': 'EURUSD=X',
            'GBPUSD': 'GBPUSD=X',
            'USDJPY': 'USDJPY=X',
            'AUDUSD': 'AUDUSD=X'
        };
        return mapping[symbol] || symbol;
    }

    generateSyntheticData(symbol, timeframe, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const intervalMs = this.getIntervalMs(timeframe);
        
        const data = [];
        let currentPrice = this.getBasePrice(symbol);
        let currentTime = new Date(start);

        while (currentTime <= end) {
            // Simulação de movimento browniano com drift
            const drift = 0.0001; // Pequeno drift positivo
            const volatility = 0.002; // Volatilidade diária
            const dt = intervalMs / (24 * 60 * 60 * 1000); // Fração do dia
            
            const randomWalk = (Math.random() - 0.5) * volatility * Math.sqrt(dt);
            const priceChange = drift * dt + randomWalk;
            
            currentPrice *= (1 + priceChange);
            
            // Gera OHLC realístico
            const spread = currentPrice * 0.0001; // Spread típico
            const high = currentPrice * (1 + Math.random() * 0.001);
            const low = currentPrice * (1 - Math.random() * 0.001);
            const open = low + Math.random() * (high - low);
            const close = low + Math.random() * (high - low);
            
            data.push({
                timestamp: new Date(currentTime),
                open: Math.max(open, low),
                high: Math.max(high, open, close),
                low: Math.min(low, open, close),
                close: close,
                volume: Math.floor(Math.random() * 1000000 + 500000)
            });

            currentTime = new Date(currentTime.getTime() + intervalMs);
        }

        return data;
    }

    getBasePrice(symbol) {
        const basePrices = {
            'EURUSD': 1.1000,
            'GBPUSD': 1.2500,
            'USDJPY': 110.00,
            'AUDUSD': 0.7500
        };
        return basePrices[symbol] || 1.0000;
    }

    getIntervalMs(timeframe) {
        const intervals = {
            '1m': 60 * 1000,
            '5m': 5 * 60 * 1000,
            '15m': 15 * 60 * 1000,
            '30m': 30 * 60 * 1000,
            '1h': 60 * 60 * 1000,
            '4h': 4 * 60 * 60 * 1000,
            '1d': 24 * 60 * 60 * 1000
        };
        return intervals[timeframe] || 60 * 1000;
    }

    filterByDateRange(data, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return data.filter(item => 
            item.timestamp >= start && item.timestamp <= end
        );
    }

    async checkRateLimit(provider) {
        const now = Date.now();
        const lastCall = this.rateLimits.get(provider) || 0;
        const minInterval = 12000; // 12 segundos entre chamadas (5 por minuto)
        
        const timeSinceLastCall = now - lastCall;
        if (timeSinceLastCall < minInterval) {
            const waitTime = minInterval - timeSinceLastCall;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.rateLimits.set(provider, Date.now());
    }

    // Métodos para dados econômicos
    async getEconomicData(indicator, country = 'US') {
        try {
            if (this.apiKeys.fred && indicator) {
                return await this.fetchFromFRED(indicator);
            }
        } catch (error) {
            console.warn(`Failed to fetch economic data for ${indicator}:`, error.message);
        }
        
        return this.generateSyntheticEconomicData(indicator, country);
    }

    async fetchFromFRED(seriesId) {
        const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
            params: {
                series_id: seriesId,
                api_key: this.apiKeys.fred,
                file_type: 'json',
                limit: 100,
                sort_order: 'desc'
            }
        });

        return response.data.observations.map(obs => ({
            date: new Date(obs.date),
            value: parseFloat(obs.value) || 0
        }));
    }

    generateSyntheticEconomicData(indicator, country) {
        const baseValues = {
            'GDP': 2.5,
            'CPI': 2.0,
            'UNEMPLOYMENT': 4.0,
            'INTEREST_RATE': 2.5
        };

        const baseValue = baseValues[indicator] || 1.0;
        const data = [];
        
        for (let i = 0; i < 24; i++) {
            data.push({
                date: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000),
                value: baseValue + (Math.random() - 0.5) * baseValue * 0.2
            });
        }

        return data.reverse();
    }

    // Método para notícias
    async getNewsData(query = 'forex trading', language = 'en') {
        try {
            if (this.apiKeys.newsApi) {
                return await this.fetchFromNewsAPI(query, language);
            }
        } catch (error) {
            console.warn('Failed to fetch news data:', error.message);
        }
        
        return this.generateSyntheticNews(query);
    }

    async fetchFromNewsAPI(query, language) {
        const response = await axios.get('https://newsapi.org/v2/everything', {
            params: {
                q: query,
                language: language,
                sortBy: 'publishedAt',
                pageSize: 50,
                apiKey: this.apiKeys.newsApi
            }
        });

        return response.data.articles.map(article => ({
            title: article.title,
            description: article.description,
            content: article.content,
            publishedAt: new Date(article.publishedAt),
            source: article.source.name,
            url: article.url
        }));
    }

    generateSyntheticNews(query) {
        const headlines = [
            'Central Bank Announces Interest Rate Decision',
            'Economic Growth Exceeds Expectations',
            'Inflation Data Shows Mixed Signals',
            'Trade Relations Improve Between Major Economies',
            'Market Volatility Increases Amid Uncertainty'
        ];

        return headlines.map((title, i) => ({
            title,
            description: `Synthetic news article about ${query}`,
            content: `This is a synthetic news article for testing purposes. ${title}`,
            publishedAt: new Date(Date.now() - i * 3600000),
            source: 'Synthetic News',
            url: '#'
        }));
    }
}

module.exports = DataProvider;