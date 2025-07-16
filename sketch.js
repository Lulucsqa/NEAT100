// Variáveis globais
let tradingEnvironment;
let tradingAgent;
let visualizer;
let backtestEngine;

function setup() {
    // Inicializa ambiente de trading
    tradingEnvironment = new TradingEnvironment({
        symbol: 'EURUSD',
        timeframe: '5m',
        initialBalance: 10000
    });
    
    // Inicializa agente de trading
    tradingAgent = new TradingAgent({
        learningRate: 0.001,
        batchSize: 32,
        memorySize: 10000,
        hiddenLayers: [128, 64]
    });
    
    // Inicializa backtesting
    backtestEngine = new BacktestEngine();
    
    // Inicializa visualização
    const canvas = document.getElementById('priceChart');
    visualizer = new TradingVisualizer(canvas);
    
    // Configura loop principal
    setInterval(update, 1000);  // Atualiza a cada segundo
}

async function update() {
    // Atualiza ambiente
    await tradingEnvironment.update();
    
    // Obtém estado atual
    const state = tradingEnvironment.getState();
    
    // Agente toma decisão
    const action = await tradingAgent.think(state);
    
    // Executa ação
    const result = tradingEnvironment.executeAction(action);
    
    // Agente aprende com resultado
    if (result.reward !== undefined) {
        tradingAgent.remember(
            state,
            action,
            result.reward,
            tradingEnvironment.getState(),
            result.done
        );
        await tradingAgent.learn();
    }
    
    // Atualiza visualizações
    visualizer.update(state);
    
    // Se episódio terminou, registra trade
    if (result.trade) {
        visualizer.addTrade(result.trade);
    }
}

async function runBacktest() {
    // Configura backtest
    const config = {
        symbol: 'EURUSD',
        timeframe: '5m',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        initialBalance: 10000,
        riskPerTrade: 0.02,
        maxTradeAmount: 1000,
        minTradeAmount: 100
    };
    
    // Executa backtest
    const results = await backtestEngine.runBacktest(tradingAgent, config);
    
    // Exibe resultados
    console.log('Backtest Results:', results);
    
    return results;
}

// Event Listeners
document.getElementById('startBtn')?.addEventListener('click', setup);
document.getElementById('stopBtn')?.addEventListener('click', () => {
    clearInterval(updateInterval);
});
document.getElementById('resetBtn')?.addEventListener('click', () => {
    tradingEnvironment.reset();
    tradingAgent = new TradingAgent();
    visualizer.reset();
});

// Exporta para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setup,
        update,
        runBacktest,
        tradingEnvironment,
        tradingAgent,
        visualizer,
        backtestEngine
    };
}
