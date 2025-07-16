const tf = require('@tensorflow/tfjs-node');
const { HYPERPARAMS } = require('./NeuralArchitecture');

class TradingAgent {
    constructor(config = {}) {
        this.config = {
            learningRate: 0.001,
            batchSize: 32,
            memorySize: 10000,
            gamma: 0.99,
            epsilon: 1.0,
            epsilonMin: 0.01,
            epsilonDecay: 0.995,
            hiddenLayers: [128, 64],
            ...config
        };
        
        this.memory = [];
        this.episode = 0;
        this.step = 0;
        
        // Métricas de performance
        this.metrics = {
            totalReward: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            profitFactor: 0,
            sharpeRatio: 0,
            maxDrawdown: 0
        };
        
        // Estado do agente
        this.state = {
            currentPosition: null,
            lastAction: null,
            confidence: 0,
            riskLevel: 0.5,  // Dinâmico baseado no regime de mercado
            adaptiveThreshold: 0.5  // Ajustado com base na volatilidade
        };
        
        this.initialize();
    }

    initialize() {
        // Cria modelo principal
        this.model = this.createModel();
        
        // Cria modelo alvo para DQN
        this.targetModel = this.createModel();
        this.updateTargetModel();
    }

    createModel() {
        const model = tf.sequential();
        
        // Camada de entrada
        model.add(tf.layers.dense({
            units: this.config.hiddenLayers[0],
            activation: 'relu',
            inputShape: [this.getStateSize()]
        }));
        
        // Camadas ocultas
        for (let i = 1; i < this.config.hiddenLayers.length; i++) {
            model.add(tf.layers.dense({
                units: this.config.hiddenLayers[i],
                activation: 'relu'
            }));
        }
        
        // Dropout para regularização
        model.add(tf.layers.dropout({ rate: 0.2 }));
        
        // Camada de saída (3 ações: comprar, vender, manter)
        model.add(tf.layers.dense({
            units: 3,
            activation: 'softmax'
        }));
        
        model.compile({
            optimizer: tf.train.adam(this.config.learningRate),
            loss: 'meanSquaredError'
        });
        
        return model;
    }

    getStateSize() {
        // Tamanho do estado incluindo todos os indicadores
        return 50;  // Ajuste baseado nos indicadores disponíveis
    }

    preprocessState(state) {
        // Normaliza dados do mercado
        const price = state.price;
        const normalizedPrice = (price - state.bb.middle) / (state.bb.upper - state.bb.middle);
        
        // Indicadores técnicos normalizados
        const technicalFeatures = [
            (state.sma - price) / price,
            (state.rsi - 50) / 50,
            normalizedPrice,
            (state.bb.upper - price) / price,
            (state.bb.lower - price) / price,
            state.indicators.macd.histogram / price,
            state.indicators.adx.value / 100,
            state.indicators.stochastic.k / 100,
            state.indicators.stochastic.d / 100,
            state.indicators.cci / 300,
            state.indicators.mfi / 100,
            state.indicators.atr / price
        ];
        
        // Métricas de mercado
        const marketFeatures = [
            state.marketState.volatility,
            state.marketState.trend,
            state.marketState.sentiment.technical,
            state.marketState.sentiment.fundamental,
            state.marketState.sentiment.combined
        ];
        
        // Padrões de preço (one-hot encoding)
        const patterns = new Array(10).fill(0);
        if (state.indicators.patterns.length > 0) {
            patterns[state.indicators.patterns[0].type] = 1;
        }
        
        // Regime de mercado (one-hot encoding)
        const regimes = {
            'VOLATILE': [1, 0, 0, 0],
            'RANGE': [0, 1, 0, 0],
            'UPTREND': [0, 0, 1, 0],
            'DOWNTREND': [0, 0, 0, 1]
        };
        const regimeEncoding = regimes[state.marketState.regime] || [0, 0, 0, 0];
        
        // Posição atual (one-hot encoding)
        const positionEncoding = [
            this.state.currentPosition === 'long' ? 1 : 0,
            this.state.currentPosition === 'short' ? 1 : 0,
            this.state.currentPosition === null ? 1 : 0
        ];
        
        // Concatena todas as features
        return tf.tensor2d([
            ...technicalFeatures,
            ...marketFeatures,
            ...patterns,
            ...regimeEncoding,
            ...positionEncoding
        ], [1, this.getStateSize()]);
    }

    async think(state) {
        // Pré-processa o estado
        const processedState = this.preprocessState(state);
        
        // Decide ação usando epsilon-greedy
        let action;
        if (Math.random() < this.config.epsilon) {
            action = Math.floor(Math.random() * 3);  // Exploração
        } else {
            const prediction = this.model.predict(processedState);
            action = tf.argMax(prediction, 1).dataSync()[0];  // Exploitação
        }
        
        // Atualiza epsilon
        if (this.config.epsilon > this.config.epsilonMin) {
            this.config.epsilon *= this.config.epsilonDecay;
        }
        
        // Ajusta nível de risco baseado no regime de mercado
        this.adjustRiskLevel(state.marketState);
        
        // Calcula confiança na decisão
        const prediction = this.model.predict(processedState);
        const probabilities = prediction.dataSync();
        this.state.confidence = probabilities[action];
        
        // Aplica threshold adaptativo
        if (this.state.confidence < this.state.adaptiveThreshold) {
            return 'hold';  // Mantém posição se confiança baixa
        }
        
        // Mapeia ação para decisão
        const actions = ['buy', 'sell', 'hold'];
        this.state.lastAction = actions[action];
        
        return actions[action];
    }

    adjustRiskLevel(marketState) {
        // Ajusta nível de risco baseado no regime e volatilidade
        if (marketState.regime === 'VOLATILE') {
            this.state.riskLevel = Math.max(0.2, this.state.riskLevel * 0.8);
        } else if (marketState.regime === 'RANGE') {
            this.state.riskLevel = 0.5;
        } else if (['UPTREND', 'DOWNTREND'].includes(marketState.regime)) {
            this.state.riskLevel = Math.min(0.8, this.state.riskLevel * 1.2);
        }
        
        // Ajusta threshold baseado na volatilidade
        this.state.adaptiveThreshold = 0.5 + (marketState.volatility * 0.5);
    }

    remember(state, action, reward, nextState, done) {
        // Armazena experiência na memória
        this.memory.push({
            state: this.preprocessState(state),
            action,
            reward,
            nextState: this.preprocessState(nextState),
            done
        });
        
        // Limita tamanho da memória
        if (this.memory.length > this.config.memorySize) {
            this.memory.shift();
        }
        
        // Atualiza métricas
        this.updateMetrics(reward, done);
    }

    async learn() {
        if (this.memory.length < this.config.batchSize) return;
        
        // Amostra batch aleatório da memória
        const batch = this.sampleMemory();
        
        // Prepara dados para treinamento
        const states = tf.concat(batch.map(exp => exp.state));
        const nextStates = tf.concat(batch.map(exp => exp.nextState));
        
        // Calcula valores Q atuais e futuros
        const currentQ = this.model.predict(states);
        const futureQ = this.targetModel.predict(nextStates);
        
        // Atualiza valores Q
        const updatedQ = await this.calculateUpdatedQ(
            currentQ, futureQ, batch
        );
        
        // Treina o modelo
        await this.model.fit(states, updatedQ, {
            batchSize: this.config.batchSize,
            epochs: 1,
            verbose: 0
        });
        
        // Atualiza modelo alvo periodicamente
        this.step++;
        if (this.step % 100 === 0) {
            this.updateTargetModel();
        }
    }

    sampleMemory() {
        const batch = [];
        for (let i = 0; i < this.config.batchSize; i++) {
            const index = Math.floor(Math.random() * this.memory.length);
            batch.push(this.memory[index]);
        }
        return batch;
    }

    async calculateUpdatedQ(currentQ, futureQ, batch) {
        const qValues = await currentQ.array();
        const futureQValues = await futureQ.array();
        
        batch.forEach((exp, i) => {
            const currentQValue = qValues[i][exp.action];
            const maxFutureQ = Math.max(...futureQValues[i]);
            const targetQ = exp.reward + 
                (exp.done ? 0 : this.config.gamma * maxFutureQ);
            
            qValues[i][exp.action] = targetQ;
        });
        
        return tf.tensor2d(qValues);
    }

    updateTargetModel() {
        // Copia pesos do modelo principal para o modelo alvo
        const weights = this.model.getWeights();
        this.targetModel.setWeights(weights);
    }

    updateMetrics(reward, done) {
        this.metrics.totalReward += reward;
        
        if (done) {
            if (reward > 0) this.metrics.wins++;
            else if (reward < 0) this.metrics.losses++;
            
            const total = this.metrics.wins + this.metrics.losses;
            this.metrics.winRate = this.metrics.wins / total;
            
            // Atualiza outros indicadores de performance
            this.episode++;
        }
    }

    getMetrics() {
        return {
            ...this.metrics,
            epsilon: this.config.epsilon,
            episode: this.episode,
            confidence: this.state.confidence,
            riskLevel: this.state.riskLevel
        };
    }

    save() {
        return {
            weights: this.model.getWeights().map(w => w.arraySync()),
            config: this.config,
            metrics: this.metrics,
            state: this.state
        };
    }

    async load(data) {
        // Carrega configuração e estado
        this.config = data.config;
        this.metrics = data.metrics;
        this.state = data.state;
        
        // Recria modelo e carrega pesos
        this.initialize();
        const weights = data.weights.map(w => tf.tensor(w));
        this.model.setWeights(weights);
        this.updateTargetModel();
    }

    dispose() {
        this.model.dispose();
        this.targetModel.dispose();
        this.memory.forEach(exp => {
            exp.state.dispose();
            exp.nextState.dispose();
        });
    }
}

module.exports = TradingAgent;
