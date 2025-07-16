const tf = require('@tensorflow/tfjs-node');

// Hiperparâmetros otimizados para trading
const HYPERPARAMS = {
    gunasMixRatio: 0.25,        // Influência dos Gunas nas decisões
    intrinsicCuriosityFactor: 1.5, // Peso da recompensa intrínseca
    transformerHeads: 8,        // Cabeças de atenção no Transformer
    lstmUnits: 128,            // Unidades de memória LSTM
    mutationRate: 0.15,        // Taxa de mutação genética
    explorationThreshold: 0.7,  // Limiar de exploração
    
    // Parâmetros específicos para trading
    priceWindowSize: 100,      // Tamanho da janela de preços
    technicalFeatures: 15,     // Número de indicadores técnicos
    marketRegimes: 4,          // Número de regimes de mercado
    riskAdjustmentFactor: 0.8  // Fator de ajuste de risco
};

// Bloco Transformer customizado com atenção multi-cabeça
class MarketTransformerBlock extends tf.layers.Layer {
    constructor(config) {
        super(config);
        this.numHeads = config.numHeads;
        this.keyDim = config.keyDim;
        this.dropoutRate = config.dropoutRate || 0.1;
    }

    build(inputShape) {
        this.multiHeadAttention = tf.layers.multiHeadAttention({
            numHeads: this.numHeads,
            keyDim: this.keyDim,
            dropout: this.dropoutRate
        });
        
        // Camadas de normalização e processamento
        this.normalization1 = tf.layers.layerNormalization();
        this.normalization2 = tf.layers.layerNormalization();
        
        this.ffn = tf.sequential({
            layers: [
                tf.layers.dense({
                    units: this.keyDim * 4,
                    activation: 'gelu'
                }),
                tf.layers.dropout({ rate: this.dropoutRate }),
                tf.layers.dense({ units: this.keyDim })
            ]
        });
    }

    call(inputs, training) {
        const [input, mask] = Array.isArray(inputs) ? inputs : [inputs];
        
        // Multi-head attention com skip connection
        let output = this.multiHeadAttention.apply([input, input, input, mask]);
        output = this.normalization1.apply(tf.add(input, output));
        
        // Feed-forward network com segunda skip connection
        const ffnOutput = this.ffn.apply(output);
        return this.normalization2.apply(tf.add(output, ffnOutput));
    }

    static get className() { return 'MarketTransformerBlock'; }
}

// Registra a camada customizada
tf.serialization.registerClass(MarketTransformerBlock);

// Processador de dados de mercado com LSTM e Transformer
class MarketProcessor {
    constructor() {
        this.buildArchitecture();
    }

    buildArchitecture() {
        // Pipeline de processamento de preços
        this.priceProcessor = tf.sequential({
            layers: [
                tf.layers.lstm({
                    units: HYPERPARAMS.lstmUnits,
                    returnSequences: true,
                    kernelInitializer: 'glorotNormal',
                    recurrentDropout: 0.2
                }),
                new MarketTransformerBlock({
                    numHeads: HYPERPARAMS.transformerHeads,
                    keyDim: 64,
                    dropoutRate: 0.1
                }),
                tf.layers.dense({ units: 32, activation: 'swish' })
            ]
        });

        // Processador de indicadores técnicos
        this.technicalProcessor = tf.sequential({
            layers: [
                tf.layers.dense({
                    units: 64,
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({ l2: 1e-4 })
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 32, activation: 'swish' })
            ]
        });

        // Integrador de informações de mercado
        this.marketIntegrator = tf.sequential({
            layers: [
                tf.layers.concatenate(),
                new MarketTransformerBlock({
                    numHeads: 4,
                    keyDim: 32,
                    dropoutRate: 0.1
                }),
                tf.layers.dense({
                    units: HYPERPARAMS.marketRegimes,
                    activation: 'softmax'
                })
            ]
        });
    }

    async processMarketState(priceData, technicalData) {
        const priceTensor = tf.tensor2d(priceData).expandDims(0);
        const technicalTensor = tf.tensor2d(technicalData).expandDims(0);

        // Processamento paralelo
        const [priceFeatures, technicalFeatures] = await Promise.all([
            this.priceProcessor.predict(priceTensor),
            this.technicalProcessor.predict(technicalTensor)
        ]);

        // Integração de features
        const marketRegime = this.marketIntegrator.predict(
            tf.concat([priceFeatures, technicalFeatures], -1)
        );

        // Cleanup
        tf.dispose([priceTensor, technicalTensor, priceFeatures, technicalFeatures]);

        return marketRegime;
    }

    dispose() {
        this.priceProcessor.dispose();
        this.technicalProcessor.dispose();
        this.marketIntegrator.dispose();
    }
}

// Sistema de Gunas para personalidade de trading
class TradingGunas {
    constructor(parent = null) {
        this.gunas = parent ? this.mutateGunas(parent.gunas) : {
            sattva: tf.randomNormal([1], 0.5, 0.1).dataSync()[0], // Equilíbrio
            rajas: tf.randomNormal([1], 0.3, 0.08).dataSync()[0], // Atividade
            tamas: tf.randomNormal([1], 0.2, 0.05).dataSync()[0]  // Inércia
        };

        this.normalizeGunas();
    }

    normalizeGunas() {
        const sum = Object.values(this.gunas).reduce((a, b) => a + b);
        Object.keys(this.gunas).forEach(k => this.gunas[k] /= sum);
    }

    mutateGunas(parentGunas) {
        const mutated = {};
        Object.entries(parentGunas).forEach(([k, v]) => {
            mutated[k] = tf.clipByValue(
                v * tf.randomNormal([1], 1, 0.15).dataSync()[0],
                0.1, 0.8
            ).dataSync()[0];
        });
        return mutated;
    }

    modifyDecision(actionProbabilities) {
        const { sattva, rajas, tamas } = this.gunas;

        // Fatores de influência
        const riskAversion = sattva * HYPERPARAMS.riskAdjustmentFactor;
        const aggressiveness = rajas * (1 - tamas);
        const conservatism = tamas * (1 - rajas);

        // Modifica probabilidades de ação
        return actionProbabilities.map((prob, i) => {
            const modified = prob * (
                1 + HYPERPARAMS.gunasMixRatio * (
                    riskAversion * Math.cos(i) +
                    aggressiveness * Math.random() -
                    conservatism * Math.log(1 + i)
                )
            );
            return tf.clipByValue(modified, 0, 1).dataSync()[0];
        });
    }
}

module.exports = {
    HYPERPARAMS,
    MarketTransformerBlock,
    MarketProcessor,
    TradingGunas
};
