const DataProvider = require('../data/DataProvider');

class FundamentalAnalysis {
    constructor() {
        this.dataProvider = new DataProvider();
        this.economicData = {};
        this.newsData = [];
        this.sentimentScores = {};
        this.lastUpdate = 0;
        
        this.isInitialized = false;
    }

    async initialize() {
        try {
            await this.updateEconomicData();
            await this.updateNewsData();
            this.isInitialized = true;
            console.log('Fundamental Analysis initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Fundamental Analysis:', error);
            throw error;
        }
    }

    async updateEconomicData() {
        const indicators = ['GDP', 'CPI', 'UNEMPLOYMENT', 'INTEREST_RATE'];
        const countries = ['US', 'EU', 'UK', 'JP'];
        
        for (const country of countries) {
            this.economicData[country] = {};
            
            for (const indicator of indicators) {
                try {
                    this.economicData[country][indicator] = 
                        await this.dataProvider.getEconomicData(indicator, country);
                } catch (error) {
                    console.warn(`Failed to fetch ${indicator} for ${country}:`, error.message);
                    this.economicData[country][indicator] = [];
                }
            }
        }
    }

    async updateNewsData() {
        const queries = [
            'forex trading',
            'central bank',
            'interest rates',
            'economic policy',
            'trade war',
            'inflation'
        ];

        this.newsData = [];
        
        for (const query of queries) {
            try {
                const news = await this.dataProvider.getNewsData(query);
                this.newsData.push(...news);
            } catch (error) {
                console.warn(`Failed to fetch news for ${query}:`, error.message);
            }
        }

        // Remove duplicatas e ordena por data
        this.newsData = this.removeDuplicateNews(this.newsData)
            .sort((a, b) => b.publishedAt - a.publishedAt)
            .slice(0, 100); // Mantém apenas as 100 mais recentes

        // Calcula sentimento
        await this.calculateNewsSentiment();
    }

    removeDuplicateNews(news) {
        const seen = new Set();
        return news.filter(item => {
            const key = item.title + item.publishedAt.toISOString();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    async calculateNewsSentiment() {
        for (const news of this.newsData) {
            news.sentiment = this.analyzeSentiment(news.title + ' ' + news.description);
        }
    }

    analyzeSentiment(text) {
        // Análise de sentimento simplificada baseada em palavras-chave
        const positiveWords = [
            'growth', 'increase', 'rise', 'bull', 'positive', 'strong', 
            'improvement', 'recovery', 'expansion', 'optimistic', 'gain'
        ];
        
        const negativeWords = [
            'decline', 'fall', 'bear', 'negative', 'weak', 'recession',
            'crisis', 'drop', 'loss', 'pessimistic', 'concern', 'risk'
        ];

        const words = text.toLowerCase().split(/\W+/);
        let positiveScore = 0;
        let negativeScore = 0;

        for (const word of words) {
            if (positiveWords.includes(word)) positiveScore++;
            if (negativeWords.includes(word)) negativeScore++;
        }

        const total = positiveScore + negativeScore;
        if (total === 0) {
            return { positive: 0.33, negative: 0.33, neutral: 0.34 };
        }

        return {
            positive: positiveScore / total,
            negative: negativeScore / total,
            neutral: Math.max(0, 1 - (positiveScore + negativeScore) / total)
        };
    }

    getStateForTimestamp(timestamp) {
        if (!this.isInitialized) {
            return this.getDefaultFundamentalState();
        }

        return {
            economicIndicators: this.getEconomicIndicatorsState(timestamp),
            newsSentiment: this.getNewsSentimentState(timestamp),
            interestRateDifferentials: this.getInterestRateDifferentials(),
            economicCalendar: this.getUpcomingEvents(timestamp),
            marketRegime: this.getMarketRegime(timestamp)
        };
    }

    getEconomicIndicatorsState(timestamp) {
        const state = {};
        const countries = ['US', 'EU', 'UK', 'JP'];
        
        for (const country of countries) {
            state[country] = {};
            
            if (this.economicData[country]) {
                // GDP Growth
                const gdpData = this.getLatestValue(this.economicData[country].GDP, timestamp);
                state[country].gdpGrowth = gdpData ? gdpData.value : 0;
                
                // Inflation
                const cpiData = this.getLatestValue(this.economicData[country].CPI, timestamp);
                state[country].inflation = cpiData ? cpiData.value : 0;
                
                // Unemployment
                const unemploymentData = this.getLatestValue(this.economicData[country].UNEMPLOYMENT, timestamp);
                state[country].unemployment = unemploymentData ? unemploymentData.value : 0;
                
                // Interest Rate
                const rateData = this.getLatestValue(this.economicData[country].INTEREST_RATE, timestamp);
                state[country].interestRate = rateData ? rateData.value : 0;
            }
        }
        
        return state;
    }

    getLatestValue(dataArray, timestamp) {
        if (!dataArray || dataArray.length === 0) return null;
        
        // Encontra o valor mais recente antes ou igual ao timestamp
        const validData = dataArray.filter(item => item.date <= timestamp);
        return validData.length > 0 ? validData[validData.length - 1] : null;
    }

    getNewsSentimentState(timestamp) {
        // Considera notícias das últimas 24 horas
        const oneDayAgo = new Date(timestamp.getTime() - 24 * 60 * 60 * 1000);
        const recentNews = this.newsData.filter(news => 
            news.publishedAt >= oneDayAgo && news.publishedAt <= timestamp
        );

        if (recentNews.length === 0) {
            return { positive: 0.33, negative: 0.33, neutral: 0.34, newsCount: 0 };
        }

        // Agrega sentimentos
        const totalSentiment = recentNews.reduce((acc, news) => ({
            positive: acc.positive + news.sentiment.positive,
            negative: acc.negative + news.sentiment.negative,
            neutral: acc.neutral + news.sentiment.neutral
        }), { positive: 0, negative: 0, neutral: 0 });

        const count = recentNews.length;
        return {
            positive: totalSentiment.positive / count,
            negative: totalSentiment.negative / count,
            neutral: totalSentiment.neutral / count,
            newsCount: count
        };
    }

    getInterestRateDifferentials() {
        const rates = {};
        const countries = ['US', 'EU', 'UK', 'JP'];
        
        for (const country of countries) {
            if (this.economicData[country] && this.economicData[country].INTEREST_RATE) {
                const latest = this.economicData[country].INTEREST_RATE[0];
                rates[country] = latest ? latest.value : 0;
            } else {
                rates[country] = 0;
            }
        }

        return {
            USD_EUR: rates.US - rates.EU,
            USD_GBP: rates.US - rates.UK,
            USD_JPY: rates.US - rates.JP,
            EUR_GBP: rates.EU - rates.UK,
            EUR_JPY: rates.EU - rates.JP,
            GBP_JPY: rates.UK - rates.JP
        };
    }

    getUpcomingEvents(timestamp) {
        // Simula eventos econômicos futuros
        const events = [];
        const eventTypes = [
            'Interest Rate Decision',
            'GDP Release',
            'CPI Data',
            'Employment Report',
            'Trade Balance'
        ];

        const impacts = ['High', 'Medium', 'Low'];
        
        for (let i = 1; i <= 7; i++) {
            const eventDate = new Date(timestamp.getTime() + i * 24 * 60 * 60 * 1000);
            
            if (Math.random() < 0.3) { // 30% chance de evento por dia
                events.push({
                    date: eventDate,
                    event: eventTypes[Math.floor(Math.random() * eventTypes.length)],
                    country: ['US', 'EU', 'UK', 'JP'][Math.floor(Math.random() * 4)],
                    impact: impacts[Math.floor(Math.random() * impacts.length)],
                    forecast: Math.random() * 4 - 2, // -2 a 2
                    previous: Math.random() * 4 - 2
                });
            }
        }

        return events;
    }

    getMarketRegime(timestamp) {
        // Analisa regime baseado em dados fundamentais
        const economicState = this.getEconomicIndicatorsState(timestamp);
        const sentiment = this.getNewsSentimentState(timestamp);
        
        // Lógica simplificada para determinar regime
        let regime = 'NEUTRAL';
        let confidence = 0.5;

        // Análise de crescimento
        const avgGrowth = this.calculateAverageGrowth(economicState);
        if (avgGrowth > 2.5) {
            regime = 'GROWTH';
            confidence += 0.2;
        } else if (avgGrowth < 1.0) {
            regime = 'RECESSION';
            confidence += 0.2;
        }

        // Análise de sentimento
        if (sentiment.positive > 0.6) {
            regime = regime === 'NEUTRAL' ? 'OPTIMISTIC' : regime;
            confidence += 0.15;
        } else if (sentiment.negative > 0.6) {
            regime = regime === 'NEUTRAL' ? 'PESSIMISTIC' : regime;
            confidence += 0.15;
        }

        return { regime, confidence: Math.min(confidence, 1.0) };
    }

    calculateAverageGrowth(economicState) {
        const countries = Object.keys(economicState);
        if (countries.length === 0) return 2.0; // Default

        const growthRates = countries
            .map(country => economicState[country].gdpGrowth || 0)
            .filter(rate => rate > 0);

        return growthRates.length > 0 
            ? growthRates.reduce((a, b) => a + b) / growthRates.length 
            : 2.0;
    }

    getDefaultFundamentalState() {
        return {
            economicIndicators: {
                US: { gdpGrowth: 2.5, inflation: 2.0, unemployment: 4.0, interestRate: 2.5 },
                EU: { gdpGrowth: 1.8, inflation: 1.5, unemployment: 7.0, interestRate: 0.0 },
                UK: { gdpGrowth: 1.5, inflation: 2.2, unemployment: 4.5, interestRate: 1.0 },
                JP: { gdpGrowth: 1.0, inflation: 0.5, unemployment: 2.8, interestRate: -0.1 }
            },
            newsSentiment: { positive: 0.33, negative: 0.33, neutral: 0.34, newsCount: 0 },
            interestRateDifferentials: {
                USD_EUR: 2.5, USD_GBP: 1.5, USD_JPY: 2.6,
                EUR_GBP: -1.0, EUR_JPY: 0.1, GBP_JPY: 1.1
            },
            economicCalendar: [],
            marketRegime: { regime: 'NEUTRAL', confidence: 0.5 }
        };
    }

    // Método para calcular impacto no par de moedas
    calculateCurrencyPairImpact(baseCurrency, quoteCurrency) {
        const baseCountry = this.getCurrencyCountry(baseCurrency);
        const quoteCountry = this.getCurrencyCountry(quoteCurrency);
        
        const baseState = this.economicData[baseCountry] || {};
        const quoteState = this.economicData[quoteCountry] || {};
        
        // Calcula diferencial de força econômica
        const strengthDifferential = this.calculateEconomicStrength(baseState) - 
                                   this.calculateEconomicStrength(quoteState);
        
        return {
            strengthDifferential,
            recommendation: this.getTradeRecommendation(strengthDifferential),
            confidence: this.calculateConfidence(baseState, quoteState)
        };
    }

    getCurrencyCountry(currency) {
        const mapping = {
            'USD': 'US',
            'EUR': 'EU', 
            'GBP': 'UK',
            'JPY': 'JP'
        };
        return mapping[currency] || 'US';
    }

    calculateEconomicStrength(countryData) {
        if (!countryData || Object.keys(countryData).length === 0) return 0;
        
        const gdp = this.getLatestValue(countryData.GDP)?.value || 0;
        const inflation = this.getLatestValue(countryData.CPI)?.value || 0;
        const unemployment = this.getLatestValue(countryData.UNEMPLOYMENT)?.value || 0;
        const interestRate = this.getLatestValue(countryData.INTEREST_RATE)?.value || 0;
        
        // Fórmula simplificada de força econômica
        return (gdp * 0.4) + (interestRate * 0.3) - (unemployment * 0.2) + 
               (Math.max(0, 2 - Math.abs(inflation - 2)) * 0.1);
    }

    getTradeRecommendation(strengthDifferential) {
        if (strengthDifferential > 0.5) return 'BUY';
        if (strengthDifferential < -0.5) return 'SELL';
        return 'HOLD';
    }

    calculateConfidence(baseState, quoteState) {
        // Calcula confiança baseada na disponibilidade e qualidade dos dados
        const baseDataQuality = this.assessDataQuality(baseState);
        const quoteDataQuality = this.assessDataQuality(quoteState);
        
        return (baseDataQuality + quoteDataQuality) / 2;
    }

    assessDataQuality(countryData) {
        if (!countryData) return 0.3;
        
        const indicators = ['GDP', 'CPI', 'UNEMPLOYMENT', 'INTEREST_RATE'];
        let availableIndicators = 0;
        
        for (const indicator of indicators) {
            if (countryData[indicator] && countryData[indicator].length > 0) {
                availableIndicators++;
            }
        }
        
        return 0.3 + (availableIndicators / indicators.length) * 0.7;
    }
}

module.exports = FundamentalAnalysis;