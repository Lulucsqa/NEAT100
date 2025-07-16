import Population from './population.js';
import InnovationTracker from '../genetics/innovation-tracker.js';
import Visualizer from '../visualization/visualizer.js';

export default class NEAT {
  constructor(config = {}) {
    this.config = this.validateConfig({
      populationSize: 50,
      mutationRate: 0.8,
      crossoverRate: 0.2,
      inputNodes: 3,
      outputNodes: 2,
      ...config
    });
    
    this.innovationTracker = new InnovationTracker();
    this.population = new Population(this.config, this.innovationTracker);
    this.generation = 0;
    this.visualizer = new Visualizer('networkCanvas');
  }

  validateConfig(config) {
    if (config.populationSize <= 0) {
      throw new Error('Population size must be positive');
    }
    return config;
  }

  evolve() {
    this.population.evaluate();
    this.population.adjustFitness();  // Add this line
    this.population.speciate();
    this.population.select();
    this.population.reproduce();
    this.generation++;
    
    // Update both visualizations
    this.updateNetworkVisualization();
    this.updateSpeciesVisualization();
    
    return this.getBestGenome();
}

updateSpeciesVisualization() {
    this.visualizer.drawSpecies(this.population.species);
}

  getBestGenome() {
    return this.population.getBestGenome();
  }

  updateVisualization() {
    const bestGenome = this.getBestGenome();
    const nodes = this.getNodePositions(bestGenome);
    const connections = this.getConnectionData(bestGenome);
    
    this.visualizer.drawNetwork(nodes, connections);
    
    document.getElementById('generation').textContent = this.generation;
    document.getElementById('bestFitness').textContent = bestGenome.fitness.toFixed(2);
  }
}