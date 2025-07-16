// Configurações centralizadas do sistema
const config = {
    // Configurações NEAT
    neat: {
        populationSize: 150,
        inputs: 20,  // Indicadores técnicos + fundamentalistas
        outputs: 3,  // Buy, Sell, Hold
        mutationRates: {
            weight: 0.1,
            connection: 0.05,
            node: 0.02,
            enable: 0.1,
            disable: 0.1
        },
        speciation: {
            compatibilityThreshold: 3.0,
            excessCoeff: 1.0,
            disjointCoeff: 1.0,
            weightDiffCoeff: 0.4
        }
    },

    // Configurações de Trading
    trading: {
        symbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'],
        timeframes: ['5m', '15m', '1h', '4h'],
        riskManagement: {
            maxRiskPerTrade: 0.02,
            maxDrawdown: 0.15,
            positionSizing: 'kelly'
        },
        backtesting: {
            startDate: '2020-01-01',
            endDate: '2024-01-01',
            initialBalance: 10000,
            commission: 0.0001
        }
    },

    // APIs e Dados
    data: {
        providers: {
            forex: 'alpha_vantage',
            news: 'newsapi',
            economic: 'fred'
        },
        apiKeys: {
            alphaVantage: process.env.ALPHA_VANTAGE_KEY,
            newsApi: process.env.NEWS_API_KEY,
            fred: process.env.FRED_API_KEY
        },
        updateIntervals: {
            prices: 60000,      // 1 minuto
            news: 300000,       // 5 minutos
            economic: 3600000   // 1 hora
        }
    },

    // Configurações de Sistema
    system: {
        logLevel: 'info',
        saveInterval: 1000,  // Salvar a cada 1000 gerações
        maxGenerations: 10000,
        parallelProcessing: true,
        gpuAcceleration: false
    }
};

module.exports = config;