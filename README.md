# 🧬 NEAT Trading System v2.0

An advanced algorithmic trading system that combines **NEAT (NeuroEvolution of Augmenting Topologies)** with technical and fundamental analysis to create evolutionary and adaptive trading strategies.

## 🌟 Key Features

- **🧠 NEAT Algorithm**: Neural network evolution with dynamic topology
- **📊 Technical Analysis**: 15+ technical indicators (MACD, ADX, Stochastic, CCI, MFI, ATR, etc.)
- **📰 Fundamental Analysis**: Economic data processing and news sentiment analysis
- **🔄 Advanced Backtesting**: Complete system with comprehensive performance metrics
- **📈 Real-time Visualization**: Graphical interface for evolution tracking
- **🎯 Multi-Objective Optimization**: Simultaneous optimization of return, risk, and consistency
- **🚀 Modular Architecture**: Clean separation of concerns with src/ organization
- **🧪 Comprehensive Testing**: Automated test suite with coverage reporting
- **⚡ Performance Optimized**: Parallel processing and GPU acceleration support

## 🏗️ System Architecture

```
src/
├── config/           # Centralized configuration
│   └── index.js     # Main config with NEAT, trading, and system settings
├── core/            # Core components
│   ├── TradingEnvironment.js  # Main trading simulation environment
│   ├── neat.js      # NEAT algorithm implementation
│   └── population.js # Population management
├── genetics/        # NEAT genetic algorithm
│   ├── Genome.js    # Individual neural network genome
│   ├── Population.js # Population evolution and management
│   ├── Species.js   # Species classification
│   ├── ConnectionGene.js # Connection gene structure
│   ├── Node.js      # Neural network nodes
│   └── Player.js    # Individual trading agents
├── indicators/      # Technical analysis
│   └── TechnicalIndicators.js # 15+ technical indicators
├── analysis/        # Fundamental analysis
│   └── FundamentalAnalysis.js # Economic data processing
├── data/           # Data providers
│   └── DataProvider.js # Market data fetching and management
├── visualization/   # Real-time visualization
│   ├── TradingVisualizer.js # Main visualization engine
│   └── visualizer.js # Additional visualization utilities
└── tests/          # Comprehensive test suite
    ├── run-all-tests.js # Test runner
    ├── TradingEnvironment.test.js # Environment tests
    └── TechnicalIndicators.test.js # Indicator tests

Root Level:
├── BacktestEngine.js # Standalone backtesting engine
├── scripts/         # Utility scripts
│   └── run-backtest.js # Backtesting automation
├── libraries/       # Frontend libraries (p5.js, Box2D.js)
└── tests/          # Additional test files
```

## 🚀 Installation and Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/neat-trading-system.git
cd neat-trading-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure APIs (Optional)
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 4. Run the System
```bash
# Console mode (automatic evolution)
npm start

# Development mode (with hot reload)
npm run dev

# Web interface
npm run web

# Development web server
npm run web:dev
```

### 5. System Requirements
- **Node.js**: >= 16.0.0
- **Memory**: Minimum 4GB RAM (8GB+ recommended for large populations)
- **Storage**: 1GB+ for historical data and logs

## 📊 Technical Indicators Implemented

### Trend Indicators
- **MACD** (Moving Average Convergence Divergence) - Signal, histogram, and crossovers
- **ADX** (Average Directional Index) - Trend strength with +DI/-DI
- **EMA** (Exponential Moving Average) - Multiple periods supported

### Momentum Indicators
- **Stochastic Oscillator** - %K and %D with customizable smoothing
- **CCI** (Commodity Channel Index) - Overbought/oversold detection
- **RSI** (Relative Strength Index) - Momentum oscillator

### Volume Indicators
- **OBV** (On-Balance Volume) - Volume-price trend analysis
- **MFI** (Money Flow Index) - Volume-weighted RSI

### Volatility Indicators
- **ATR** (Average True Range) - Volatility measurement
- **Keltner Channels** - Volatility-based bands
- **Bollinger Bands** - Statistical price channels

### Pattern Recognition
- **Double Top/Bottom** - Reversal pattern detection
- **Head and Shoulders** - Classic reversal patterns
- **Triangle Patterns** - Continuation/reversal formations
- **Market Regime Detection** - Trend/range/volatile state identification

### Custom Indicators
- **Price Pattern Analysis** - Advanced pattern recognition
- **Market Regime Classification** - Multi-factor regime detection
- **Linear Regression** - Trend analysis and slope calculation

## 🧬 NEAT Configuration

```javascript
// src/config/index.js
neat: {
    populationSize: 150,
    inputs: 20,  // Technical indicators + fundamental data
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
}
```

## 💹 Trading Configuration

```javascript
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
}
```

## 📡 Data Configuration

```javascript
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
        prices: 60000,      // 1 minute
        news: 300000,       // 5 minutes
        economic: 3600000   // 1 hour
    }
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Specific test suites
npm run test:trading
npm run test:indicators

# Code quality
npm run lint
npm run format

# Build for production
npm run build
```

### Test Coverage
The system includes comprehensive tests for:
- **Trading Environment**: Market simulation and state management
- **Technical Indicators**: All 15+ indicators with edge cases
- **NEAT Algorithm**: Genome evolution and population dynamics
- **Backtesting Engine**: Performance metrics and trade execution
- **Data Providers**: API integration and synthetic data generation

## 📈 Backtesting

```bash
# Simple backtest
npm run backtest

# Specific backtest
node scripts/run-backtest.js EURUSD 5m 2023-01-01 2023-12-31

# Multiple backtests with export
npm run backtest -- --export

# Performance analysis
npm run analyze

# Parameter optimization
npm run optimize
```

### Example Results
```
�  Backtest Results:
   � Ionitial Balance: $10,000.00
   💰 Final Balance: $12,450.00
   📈 Total Return: 24.50%
   🎯 Win Rate: 67.3%
   📉 Max Drawdown: 8.2%
   📊 Sharpe Ratio: 1.847
   🔄 Total Trades: 156
```

### Advanced Backtesting Features
- **Multi-Symbol Testing**: Test across multiple currency pairs simultaneously
- **Multi-Timeframe Analysis**: Compare performance across different timeframes
- **Walk-Forward Optimization**: Progressive parameter optimization
- **Monte Carlo Simulation**: Statistical robustness testing
- **Performance Attribution**: Detailed trade-by-trade analysis

## 🎯 Função de Fitness Multi-Objetivo

O sistema otimiza simultaneamente:

1. **Retorno Total** (peso: 40%)
2. **Taxa de Acerto** (peso: 25%)
3. **Sharpe Ratio** (peso: 20%)
4. **Drawdown Máximo** (peso: 15%)

```javascript
fitness = (totalReturn * 100) + 
          (winRate > 0.5 ? (winRate - 0.5) * 50 : 0) +
          (sharpeRatio * 10) -
          (maxDrawdown > 0.1 ? (maxDrawdown - 0.1) * 100 : 0)
```

## 📊 Visualização

O sistema inclui visualização em tempo real com:

- **Gráfico de Preços**: Candlesticks com indicadores
- **Painel de Indicadores**: MACD, ADX, Stochastic
- **Informações da Conta**: Balance, posições, trades
- **Curva de Equity**: Performance ao longo do tempo
- **Distribuição P&L**: Histograma de lucros/perdas

## 🔧 Scripts Utilitários

```bash
# Análise de performance
npm run analyze

# Otimização de parâmetros
npm run optimize

# Linting e formatação
npm run lint
npm run format

# Build para produção
npm run build
```

## 📡 Fontes de Dados

### APIs Suportadas
- **Alpha Vantage**: Dados de preços forex
- **News API**: Notícias financeiras
- **FRED**: Dados econômicos do Federal Reserve

### Dados Sintéticos
O sistema gera dados sintéticos quando APIs não estão disponíveis, permitindo desenvolvimento e testes offline.

## 🎮 Uso Programático

```javascript
const NEATTradingSystem = require('./src/index.js');

const system = new NEATTradingSystem({
    neat: { populationSize: 100 },
    trading: { symbols: ['EURUSD'] }
});

await system.initialize();
const bestAgent = await system.runEvolution();

console.log('Best agent performance:', bestAgent.performance);
```

## 🔬 Análise Fundamentalista

O sistema processa:

- **Dados Econômicos**: PIB, inflação, emprego, taxas de juros
- **Calendário Econômico**: Eventos futuros e impactos
- **Análise de Sentimento**: Processamento de notícias
- **Diferenciais de Moedas**: Comparação entre países

## 🛡️ Gerenciamento de Risco

- **Position Sizing**: Kelly Criterion ou fixed fractional
- **Stop Loss**: Baseado em ATR ou percentual
- **Drawdown Control**: Parada automática em perdas excessivas
- **Diversificação**: Múltiplos pares e timeframes

## 🚀 Roadmap

- [ ] **Deep Learning Integration**: Modelos LSTM/Transformer
- [ ] **Real-time Trading**: Conexão com brokers
- [ ] **Portfolio Management**: Otimização multi-ativo
- [ ] **Cloud Deployment**: Execução em AWS/GCP
- [ ] **Mobile App**: Interface mobile
- [ ] **Social Trading**: Compartilhamento de estratégias

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- **Kenneth Stanley**: Criador do algoritmo NEAT
- **Comunidade QuantConnect**: Inspiração em trading algorítmico
- **TradingView**: Referência em análise técnica

## 📞 Suporte

- 📧 Email: support@neat-trading.com
- 💬 Discord: [NEAT Trading Community](https://discord.gg/neat-trading)
- 📖 Wiki: [Documentação Completa](https://github.com/your-username/neat-trading-system/wiki)

---

**⚠️ Aviso Legal**: Este sistema é para fins educacionais e de pesquisa. Trading envolve riscos significativos. Sempre teste estratégias em ambiente simulado antes de usar capital real.
