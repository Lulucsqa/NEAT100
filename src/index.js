// Sistema Principal de Trading com NEAT
const TradingEnvironment = require('./core/TradingEnvironment');
const NEATPopulation = require('./genetics/Population');
const TradingVisualizer = require('./visualization/TradingVisualizer');
const config = require('./config');

class NEATTradingSystem {
    constructor(options = {}) {
        this.config = { ...config, ...options };
        
        // Componentes principais
        this.environment = null;
        this.population = null;
        this.visualizer = null;
        
        // Estado do sistema
        this.generation = 0;
        this.isRunning = false;
        this.bestAgent = null;
        this.performanceHistory = [];
        
        // Estatísticas
        this.stats = {
            totalGenerations: 0,
            bestFitness: 0,
            averageFitness: 0,
            speciesCount: 0,
            innovationCount: 0
        };
    }

    async initialize() {
        try {
            console.log('Initializing NEAT Trading System...');
            
            // Inicializa ambiente de trading
            this.environment = new TradingEnvironment({
                symbol: this.config.trading.symbols[0],
                timeframe: this.config.trading.timeframes[0],
                initialBalance: this.config.trading.backtesting.initialBalance
            });
            
            await this.environment.initialize();
            console.log('Trading environment initialized');
            
            // Inicializa população NEAT
            this.population = new NEATPopulation({
                size: this.config.neat.populationSize,
                inputs: this.config.neat.inputs,
                outputs: this.config.neat.outputs,
                mutationRates: this.config.neat.mutationRates
            });
            
            console.log(`NEAT population initialized with ${this.config.neat.populationSize} agents`);
            
            // Inicializa visualizador se em ambiente browser
            if (typeof document !== 'undefined') {
                this.visualizer = new TradingVisualizer('tradingCanvas', {
                    width: 1200,
                    height: 800
                });
                console.log('Visualizer initialized');
            }
            
            console.log('NEAT Trading System ready!');
            return true;
            
        } catch (error) {
            console.error('Failed to initialize system:', error);
            throw error;
        }
    }

    async runEvolution() {
        if (!this.environment || !this.population) {
            throw new Error('System not initialized. Call initialize() first.');
        }

        this.isRunning = true;
        console.log('Starting evolution...');

        try {
            while (this.isRunning && this.generation < this.config.system.maxGenerations) {
                await this.runGeneration();
                this.generation++;
                
                // Salva progresso periodicamente
                if (this.generation % this.config.system.saveInterval === 0) {
                    await this.saveProgress();
                }
                
                // Atualiza visualização
                if (this.visualizer) {
                    this.updateVisualization();
                }
                
                // Log de progresso
                if (this.generation % 10 === 0) {
                    this.logProgress();
                }
            }
        } catch (error) {
            console.error('Evolution stopped due to error:', error);
            this.isRunning = false;
            throw error;
        }

        console.log('Evolution completed!');
        return this.getBestAgent();
    }

    async runGeneration() {
        console.log(`Running generation ${this.generation + 1}...`);
        
        // Avalia todos os agentes da população
        const fitnessResults = await this.evaluatePopulation();
        
        // Atualiza estatísticas
        this.updateStats(fitnessResults);
        
        // Seleciona o melhor agente
        this.updateBestAgent(fitnessResults);
        
        // Evolui população para próxima geração
        if (this.generation < this.config.system.maxGenerations - 1) {
            this.population.evolve();
        }
        
        // Registra performance desta geração
        this.recordGenerationPerformance(fitnessResults);
    }

    async evaluatePopulation() {
        const agents = this.population.getAgents();
        const results = [];
        
        console.log(`Evaluating ${agents.length} agents...`);
        
        // Avalia cada agente
        for (let i = 0; i < agents.length; i++) {
            const agent = agents[i];
            const fitness = await this.evaluateAgent(agent);
            
            results.push({
                agent,
                fitness,
                performance: agent.performance || {}
            });
            
            // Progress indicator
            if ((i + 1) % 10 === 0) {
                console.log(`Evaluated ${i + 1}/${agents.length} agents`);
            }
        }
        
        return results.sort((a, b) => b.fitness - a.fitness);
    }

    async evaluateAgent(agent) {
        // Reset environment for new evaluation
        this.environment.reset();
        
        let totalReward = 0;
        let stepCount = 0;
        const maxSteps = this.environment.priceData.length - 100;
        
        // Run agent through trading environment
        while (this.environment.step() && stepCount < maxSteps) {
            const state = this.environment.getState();
            if (!state) continue;
            
            // Convert state to neural network inputs
            const inputs = this.stateToInputs(state);
            
            // Get agent's decision
            const outputs = agent.activate(inputs);
            const action = this.outputsToAction(outputs);
            
            // Execute action in environment
            const result = this.environment.executeAction(action);
            totalReward += result.reward || 0;
            
            stepCount++;
        }
        
        // Calculate final fitness
        const performance = this.environment.getPerformanceMetrics();
        const fitness = this.calculateFitness(performance, totalReward, stepCount);
        
        // Store performance data in agent
        agent.performance = {
            ...performance,
            totalReward,
            stepCount,
            fitness
        };
        
        return fitness;
    }

    stateToInputs(state) {
        const inputs = [];
        
        // Price-based inputs (normalized)
        if (state.prices && state.prices.length > 0) {
            inputs.push(...state.prices.slice(-5)); // Last 5 price ratios
        } else {
            inputs.push(...new Array(5).fill(0));
        }
        
        // Technical indicators
        inputs.push(
            this.normalizeValue(state.macd?.value || 0, -0.01, 0.01),
            this.normalizeValue(state.macd?.signal || 0, -0.01, 0.01),
            this.normalizeValue(state.macd?.histogram || 0, -0.01, 0.01),
            this.normalizeValue(state.adx?.value || 0, 0, 100),
            this.normalizeValue(state.adx?.plusDI || 0, 0, 100),
            this.normalizeValue(state.adx?.minusDI || 0, 0, 100),
            this.normalizeValue(state.stochastic?.k || 0, 0, 100),
            this.normalizeValue(state.stochastic?.d || 0, 0, 100),
            this.normalizeValue(state.cci || 0, -200, 200),
            this.normalizeValue(state.mfi || 0, 0, 100),
            this.normalizeValue(state.atr || 0, 0, 0.01)
        );
        
        // Pattern and regime
        inputs.push(
            state.pattern || 0,
            state.regime || 0
        );
        
        // Account state
        inputs.push(
            state.balance || 0,
            state.equity || 0,
            this.normalizeValue(state.drawdown || 0, 0, 1),
            this.normalizeValue(state.openPositions || 0, 0, 5)
        );
        
        // Fundamental data (simplified)
        if (state.fundamentals) {
            inputs.push(
                this.normalizeValue(state.fundamentals.newsSentiment?.positive || 0, 0, 1),
                this.normalizeValue(state.fundamentals.newsSentiment?.negative || 0, 0, 1),
                this.normalizeValue(state.fundamentals.marketRegime?.confidence || 0, 0, 1)
            );
        } else {
            inputs.push(0, 0, 0);
        }
        
        // Ensure we have exactly the expected number of inputs
        while (inputs.length < this.config.neat.inputs) {
            inputs.push(0);
        }
        
        return inputs.slice(0, this.config.neat.inputs);
    }

    normalizeValue(value, min, max) {
        if (max === min) return 0;
        return Math.max(-1, Math.min(1, (value - min) / (max - min) * 2 - 1));
    }

    outputsToAction(outputs) {
        // Convert neural network outputs to trading action
        // outputs[0] = buy signal, outputs[1] = sell signal, outputs[2] = hold signal
        
        const maxIndex = outputs.indexOf(Math.max(...outputs));
        return maxIndex; // 0 = buy, 1 = sell, 2 = hold
    }

    calculateFitness(performance, totalReward, stepCount) {
        // Multi-objective fitness function
        let fitness = 0;
        
        // Primary: Total return
        fitness += (performance.totalReturn || 0) * 100;
        
        // Reward for profitable trades
        if (performance.winRate > 0.5) {
            fitness += (performance.winRate - 0.5) * 50;
        }
        
        // Penalty for excessive drawdown
        if (performance.maxDrawdown > 0.1) {
            fitness -= (performance.maxDrawdown - 0.1) * 100;
        }
        
        // Reward for Sharpe ratio
        fitness += (performance.sharpeRatio || 0) * 10;
        
        // Penalty for too few trades (inactivity)
        if (performance.totalTrades < 5) {
            fitness -= (5 - performance.totalTrades) * 5;
        }
        
        // Penalty for too many trades (overtrading)
        if (performance.totalTrades > 100) {
            fitness -= (performance.totalTrades - 100) * 0.5;
        }
        
        // Bonus for consistency (low volatility of returns)
        if (performance.totalTrades > 10) {
            // This would require calculating return volatility
            // For now, we'll use a simplified version
            fitness += Math.min(10, performance.totalTrades / 10);
        }
        
        return Math.max(0, fitness); // Ensure non-negative fitness
    }

    updateStats(results) {
        this.stats.totalGenerations = this.generation + 1;
        this.stats.bestFitness = results[0]?.fitness || 0;
        this.stats.averageFitness = results.reduce((sum, r) => sum + r.fitness, 0) / results.length;
        this.stats.speciesCount = this.population.getSpeciesCount();
        this.stats.innovationCount = this.population.getInnovationCount();
    }

    updateBestAgent(results) {
        const currentBest = results[0];
        
        if (!this.bestAgent || currentBest.fitness > this.bestAgent.fitness) {
            this.bestAgent = {
                agent: currentBest.agent.clone(),
                fitness: currentBest.fitness,
                performance: { ...currentBest.performance },
                generation: this.generation
            };
            
            console.log(`New best agent found! Fitness: ${currentBest.fitness.toFixed(4)}`);
        }
    }

    recordGenerationPerformance(results) {
        const generationData = {
            generation: this.generation,
            bestFitness: results[0]?.fitness || 0,
            averageFitness: this.stats.averageFitness,
            worstFitness: results[results.length - 1]?.fitness || 0,
            speciesCount: this.stats.speciesCount,
            bestPerformance: results[0]?.performance || {}
        };
        
        this.performanceHistory.push(generationData);
    }

    updateVisualization() {
        if (!this.visualizer) return;
        
        // Update visualizer with current best agent's performance
        if (this.bestAgent) {
            // Run best agent through environment for visualization
            this.environment.reset();
            
            // This would require running the best agent and capturing the trades
            // For now, we'll update with current environment state
            this.visualizer.updateData(this.environment);
        }
    }

    logProgress() {
        console.log(`
=== Generation ${this.generation} ===
Best Fitness: ${this.stats.bestFitness.toFixed(4)}
Average Fitness: ${this.stats.averageFitness.toFixed(4)}
Species Count: ${this.stats.speciesCount}
Innovation Count: ${this.stats.innovationCount}
        `);
        
        if (this.bestAgent?.performance) {
            const perf = this.bestAgent.performance;
            console.log(`
Best Agent Performance:
- Total Return: ${(perf.totalReturn * 100).toFixed(2)}%
- Win Rate: ${(perf.winRate * 100).toFixed(1)}%
- Max Drawdown: ${(perf.maxDrawdown * 100).toFixed(2)}%
- Sharpe Ratio: ${perf.sharpeRatio.toFixed(3)}
- Total Trades: ${perf.totalTrades}
            `);
        }
    }

    async saveProgress() {
        const saveData = {
            generation: this.generation,
            stats: this.stats,
            bestAgent: this.bestAgent ? {
                fitness: this.bestAgent.fitness,
                performance: this.bestAgent.performance,
                generation: this.bestAgent.generation,
                genome: this.bestAgent.agent.exportGenome()
            } : null,
            performanceHistory: this.performanceHistory,
            config: this.config
        };
        
        // In a real implementation, you'd save to file or database
        console.log('Progress saved (placeholder)');
        
        // For browser environment, could save to localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('neat_trading_progress', JSON.stringify(saveData));
        }
    }

    async loadProgress() {
        // In a real implementation, you'd load from file or database
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('neat_trading_progress');
            if (saved) {
                const data = JSON.parse(saved);
                this.generation = data.generation || 0;
                this.stats = data.stats || this.stats;
                this.performanceHistory = data.performanceHistory || [];
                
                if (data.bestAgent) {
                    // Would need to reconstruct agent from genome
                    console.log('Best agent loaded from save');
                }
                
                console.log(`Progress loaded from generation ${this.generation}`);
                return true;
            }
        }
        return false;
    }

    getBestAgent() {
        return this.bestAgent;
    }

    getStats() {
        return { ...this.stats };
    }

    getPerformanceHistory() {
        return [...this.performanceHistory];
    }

    stop() {
        this.isRunning = false;
        console.log('Evolution stopped by user');
    }

    // Test best agent on new data
    async testBestAgent(testEnvironment) {
        if (!this.bestAgent) {
            throw new Error('No best agent available for testing');
        }
        
        console.log('Testing best agent on new data...');
        
        testEnvironment.reset();
        let totalReward = 0;
        let stepCount = 0;
        
        while (testEnvironment.step() && stepCount < 1000) {
            const state = testEnvironment.getState();
            if (!state) continue;
            
            const inputs = this.stateToInputs(state);
            const outputs = this.bestAgent.agent.activate(inputs);
            const action = this.outputsToAction(outputs);
            
            const result = testEnvironment.executeAction(action);
            totalReward += result.reward || 0;
            stepCount++;
        }
        
        const testPerformance = testEnvironment.getPerformanceMetrics();
        
        console.log('Test Results:', testPerformance);
        return testPerformance;
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NEATTradingSystem;
} else if (typeof window !== 'undefined') {
    window.NEATTradingSystem = NEATTradingSystem;
}

// Auto-start if running directly
if (require.main === module) {
    const system = new NEATTradingSystem();
    
    system.initialize()
        .then(() => system.runEvolution())
        .then(bestAgent => {
            console.log('Evolution completed successfully!');
            console.log('Best agent performance:', bestAgent.performance);
        })
        .catch(error => {
            console.error('System error:', error);
            process.exit(1);
        });
}