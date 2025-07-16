class Evaluator {
    constructor(population) {
        this.population = population;
        this.bestScore = 0;
        this.bestPlayer = null;
        this.currentGeneration = 0;
        this.generationStats = [];
    }

    // Avalia toda a população
    evaluate() {
        if (!this.population || !this.population.players || this.population.players.length === 0) {
            console.error('População inválida para avaliação');
            return;
        }

        let currentBest = this.population.players[0];
        let totalFitness = 0;
        let worstFitness = Infinity;
        
        // Encontra o melhor, pior e calcula média
        for (let player of this.population.players) {
            if (!player.fitness) player.fitness = 0;
            
            if (player.fitness > currentBest.fitness) {
                currentBest = player;
            }
            if (player.fitness < worstFitness) {
                worstFitness = player.fitness;
            }
            totalFitness += player.fitness;
        }

        // Atualiza o melhor de todos os tempos
        if (!this.bestPlayer || currentBest.fitness > this.bestScore) {
            this.bestScore = currentBest.fitness;
            this.bestPlayer = this.clonePlayer(currentBest);
        }

        // Calcula estatísticas
        const stats = {
            generation: this.currentGeneration,
            bestFitness: currentBest.fitness,
            averageFitness: totalFitness / this.population.players.length,
            worstFitness: worstFitness,
            populationSize: this.population.players.length,
            speciesCount: this.population.species ? this.population.species.length : 0
        };

        this.generationStats.push(stats);
        this.updateDisplay(stats);
        
        this.currentGeneration++;
        return stats;
    }

    // Atualiza o display com as estatísticas
    updateDisplay(stats) {
        const genElement = document.getElementById('generation');
        const bestScoreElement = document.getElementById('bestScore');
        const currentScoreElement = document.getElementById('currentScore');

        if (genElement) genElement.textContent = stats.generation;
        if (bestScoreElement) bestScoreElement.textContent = this.bestScore.toFixed(2);
        if (currentScoreElement) currentScoreElement.textContent = stats.bestFitness.toFixed(2);
    }

    // Clona um player de forma segura
    clonePlayer(player) {
        if (!player) return null;
        
        const clone = new Player(player.brain.clone());
        clone.fitness = player.fitness;
        return clone;
    }

    // Salva o melhor genoma
    saveBest() {
        if (!this.bestPlayer) return null;

        const data = {
            genome: this.bestPlayer.brain.serialize(),
            score: this.bestScore,
            generation: this.currentGeneration,
            stats: this.generationStats
        };

        const json = JSON.stringify(data);
        localStorage.setItem('neat_best_genome', json);
        return data;
    }

    // Carrega um genoma salvo
    loadBest() {
        const json = localStorage.getItem('neat_best_genome');
        if (!json) return null;

        try {
            const data = JSON.parse(json);
            if (data && data.genome) {
                const genome = new Genome(this.population.inputs, this.population.outputs, true);
                genome.deserialize(data.genome);
                
                this.bestPlayer = new Player(genome);
                this.bestScore = data.score;
                this.currentGeneration = data.generation;
                this.generationStats = data.stats || [];
                
                return this.bestPlayer;
            }
        } catch (error) {
            console.error('Erro ao carregar genoma:', error);
        }
        return null;
    }

    // Reseta o avaliador
    reset() {
        this.bestScore = 0;
        this.bestPlayer = null;
        this.currentGeneration = 0;
        this.generationStats = [];
    }
}
