const Genome = require('./Genome');
const Species = require('./Species');
const config = require('../config');

class NEATPopulation {
  constructor(options = {}) {
    this.size = options.size || config.neat.populationSize;
    this.inputs = options.inputs || config.neat.inputs;
    this.outputs = options.outputs || config.neat.outputs;
    this.mutationRates = options.mutationRates || config.neat.mutationRates;

    // Population management
    this.agents = [];
    this.species = [];
    this.generation = 0;
    this.innovationHistory = [];
    this.nextInnovationNumber = 1;

    // Best agent tracking
    this.bestAgent = null;
    this.bestFitness = 0;
    this.averageFitness = 0;

    // Statistics
    this.stats = {
      speciesCount: 0,
      averageComplexity: 0,
      totalInnovations: 0
    };

    this.initialize();
  }

  initialize() {
    console.log(`Initializing NEAT population with ${this.size} agents`);

    // Create initial population
    for (let i = 0; i < this.size; i++) {
      const genome = new Genome(this.inputs, this.outputs);
      genome.fullyConnect(this.innovationHistory);

      const agent = new NEATAgent(genome);
      this.agents.push(agent);
    }

    console.log(`Population initialized with ${this.agents.length} agents`);
  }

  getAgents() {
    return this.agents;
  }

  getSpeciesCount() {
    return this.species.length;
  }

  getInnovationCount() {
    return this.innovationHistory.length;
  }

  evolve() {
    console.log(`Evolving generation ${this.generation + 1}...`);

    // Sort agents by fitness
    this.agents.sort((a, b) => b.fitness - a.fitness);

    // Update best agent
    if (this.agents[0].fitness > this.bestFitness) {
      this.bestFitness = this.agents[0].fitness;
      this.bestAgent = this.agents[0].clone();
    }

    // Calculate average fitness
    this.averageFitness = this.agents.reduce((sum, agent) => sum + agent.fitness, 0) / this.agents.length;

    // Speciate population
    this.speciate();

    // Calculate species fitness
    this.calculateSpeciesFitness();

    // Remove weak species
    this.cullSpecies();

    // Generate next generation
    this.generateNextGeneration();

    this.generation++;
    this.updateStats();

    console.log(`Generation ${this.generation} evolved. Species: ${this.species.length}, Best fitness: ${this.bestFitness.toFixed(4)}`);
  }

  speciate() {
    // Clear existing species assignments
    this.species.forEach(species => species.agents = []);

    // Assign agents to species
    for (const agent of this.agents) {
      let foundSpecies = false;

      for (const species of this.species) {
        if (species.isCompatible(agent.genome)) {
          species.addAgent(agent);
          foundSpecies = true;
          break;
        }
      }

      // Create new species if no compatible species found
      if (!foundSpecies) {
        const newSpecies = new Species(agent);
        this.species.push(newSpecies);
      }
    }

    // Remove empty species
    this.species = this.species.filter(species => species.agents.length > 0);
  }

  calculateSpeciesFitness() {
    for (const species of this.species) {
      species.calculateFitness();
    }

    // Sort species by fitness
    this.species.sort((a, b) => b.averageFitness - a.averageFitness);
  }

  cullSpecies() {
    // Remove bottom half of each species
    for (const species of this.species) {
      species.cull();
    }

    // Remove species that haven't improved
    this.species = this.species.filter(species => !species.isStagnant());

    // Ensure at least one species remains
    if (this.species.length === 0 && this.agents.length > 0) {
      const newSpecies = new Species(this.agents[0]);
      this.species.push(newSpecies);
    }
  }

  generateNextGeneration() {
    const newAgents = [];

    // Calculate total adjusted fitness
    const totalAdjustedFitness = this.species.reduce((sum, species) =>
      sum + species.averageFitness, 0
    );

    // Generate offspring for each species
    for (const species of this.species) {
      const offspringCount = Math.floor(
        (species.averageFitness / totalAdjustedFitness) * this.size
      );

      // Always keep the champion
      if (species.agents.length > 0) {
        newAgents.push(species.champion.clone());
      }

      // Generate offspring
      for (let i = 1; i < offspringCount; i++) {
        const offspring = species.createOffspring(this.innovationHistory);
        newAgents.push(offspring);
      }
    }

    // Fill remaining slots with offspring from best species
    while (newAgents.length < this.size && this.species.length > 0) {
      const bestSpecies = this.species[0];
      const offspring = bestSpecies.createOffspring(this.innovationHistory);
      newAgents.push(offspring);
    }

    // Ensure we have exactly the right number of agents
    this.agents = newAgents.slice(0, this.size);

    // If we don't have enough agents, clone the best ones
    while (this.agents.length < this.size) {
      if (this.bestAgent) {
        this.agents.push(this.bestAgent.clone());
      } else if (this.agents.length > 0) {
        this.agents.push(this.agents[0].clone());
      } else {
        // Emergency: create new random agent
        const genome = new Genome(this.inputs, this.outputs);
        genome.fullyConnect(this.innovationHistory);
        this.agents.push(new NEATAgent(genome));
      }
    }
  }

  updateStats() {
    this.stats.speciesCount = this.species.length;
    this.stats.totalInnovations = this.innovationHistory.length;

    // Calculate average complexity
    const totalConnections = this.agents.reduce((sum, agent) =>
      sum + agent.genome.connections.length, 0
    );
    this.stats.averageComplexity = totalConnections / this.agents.length;
  }

  getStats() {
    return {
      generation: this.generation,
      populationSize: this.agents.length,
      speciesCount: this.stats.speciesCount,
      bestFitness: this.bestFitness,
      averageFitness: this.averageFitness,
      averageComplexity: this.stats.averageComplexity,
      totalInnovations: this.stats.totalInnovations
    };
  }

  exportBestAgent() {
    if (!this.bestAgent) return null;

    return {
      fitness: this.bestFitness,
      generation: this.generation,
      genome: this.bestAgent.genome.export(),
      performance: this.bestAgent.performance
    };
  }

  importAgent(agentData) {
    const genome = new Genome(this.inputs, this.outputs);
    genome.import(agentData.genome);

    const agent = new NEATAgent(genome);
    agent.fitness = agentData.fitness;
    agent.performance = agentData.performance;

    return agent;
  }
}

class NEATAgent {
  constructor(genome) {
    this.genome = genome;
    this.fitness = 0;
    this.performance = {};
    this.network = null;

    this.buildNetwork();
  }

  buildNetwork() {
    this.network = this.genome.createNetwork();
  }

  activate(inputs) {
    if (!this.network) {
      this.buildNetwork();
    }

    return this.network.activate(inputs);
  }

  clone() {
    const clonedGenome = this.genome.clone();
    const clonedAgent = new NEATAgent(clonedGenome);
    clonedAgent.fitness = this.fitness;
    clonedAgent.performance = { ...this.performance };

    return clonedAgent;
  }

  mutate(innovationHistory) {
    this.genome.mutate(innovationHistory);
    this.buildNetwork(); // Rebuild network after mutation
  }

  crossover(other) {
    const childGenome = this.genome.crossover(other.genome);
    return new NEATAgent(childGenome);
  }

  getComplexity() {
    return {
      nodes: this.genome.nodes.length,
      connections: this.genome.connections.length,
      layers: this.genome.layers
    };
  }

  export() {
    return {
      genome: this.genome.export(),
      fitness: this.fitness,
      performance: this.performance
    };
  }
}

module.exports = NEATPopulation;