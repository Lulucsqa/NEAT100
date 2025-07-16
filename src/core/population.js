import Genome from '../genetics/genome.js';

export default class Population {
    constructor(config, innovationTracker) {
        this.config = config;
        this.individuals = this.initializePopulation();
        this.species = [];
        this.speciesConfig = {
            compatibilityThreshold: 3.0,
            compatibilityModifier: 0.3,
            survivalThreshold: 0.2
        };
    }

    speciate() {
        // Clear existing species
        this.species.forEach(s => s.members = []);
        
        // Assign each genome to a species
        this.individuals.forEach(genome => {
            let foundSpecies = false;
            
            for (const species of this.species) {
                const representative = species.members[0];
                const distance = this.genomeDistance(genome, representative);
                
                if (distance < this.speciesConfig.compatibilityThreshold) {
                    species.members.push(genome);
                    foundSpecies = true;
                    break;
                }
            }
            
            if (!foundSpecies) {
                this.species.push({
                    members: [genome],
                    age: 0,
                    bestFitness: genome.fitness
                });
            }
        });
        
        // Remove empty species
        this.species = this.species.filter(s => s.members.length > 0);
        
        // Adjust compatibility threshold
        const targetSpeciesCount = 5; // Adjust as needed
        if (this.species.length < targetSpeciesCount) {
            this.speciesConfig.compatibilityThreshold -= this.speciesConfig.compatibilityModifier;
        } else if (this.species.length > targetSpeciesCount) {
            this.speciesConfig.compatibilityThreshold += this.speciesConfig.compatibilityModifier;
        }
    }

    genomeDistance(genome1, genome2) {
        let disjoint = 0, excess = 0, matching = 0, weightDiff = 0;
        let i1 = 0, i2 = 0;
        
        // Sort genes by innovation number
        const genes1 = [...genome1.genes].sort((a,b) => a.innovation - b.innovation);
        const genes2 = [...genome2.genes].sort((a,b) => a.innovation - b.innovation);
        
        while (i1 < genes1.length && i2 < genes2.length) {
            const g1 = genes1[i1];
            const g2 = genes2[i2];
            
            if (g1.innovation === g2.innovation) {
                // Matching gene
                weightDiff += Math.abs(g1.weight - g2.weight);
                matching++;
                i1++;
                i2++;
            } else if (g1.innovation < g2.innovation) {
                // Disjoint gene in genome1
                disjoint++;
                i1++;
            } else {
                // Disjoint gene in genome2
                disjoint++;
                i2++;
            }
        }
        
        // Count excess genes
        excess += genes1.length - i1;
        excess += genes2.length - i2;
        
        // Normalize
        const N = Math.max(genome1.nodes.length, genome2.nodes.length);
        const c1 = 1.0, c2 = 1.0, c3 = 0.4; // Weighting factors
        return (c1 * excess)/N + (c2 * disjoint)/N + c3 * weightDiff/matching;
    }

    adjustFitness() {
        this.species.forEach(species => {
            species.members.forEach(genome => {
                // Shared fitness is raw fitness divided by species size
                genome.adjustedFitness = genome.fitness / species.members.length;
            });
            
            // Sort by adjusted fitness
            species.members.sort((a,b) => b.adjustedFitness - a.adjustedFitness);
            
            // Update species best fitness
            species.bestFitness = Math.max(...species.members.map(g => g.fitness));
        });
    }
}