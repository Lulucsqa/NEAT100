class Species {
    constructor(p) {
      this.players = [];
      this.bestFitness = 0;
      this.champ;
      this.averageFitness = 0;
      this.staleness = 0;
      this.rep;
  
      this.excessCoeff = 1;
      this.weightDiffCoeff = 0.5;
      this.compatibilityThreshold = 3;
      if (p) {
        this.players.push(p);
        this.bestFitness = p.fitness;
        this.rep = p.brain.clone();
        this.champ = p.cloneForReplay();
      }
    }
  
    sameSpecies(g) {
      var compatibility;
      var excessAndDisjoint = this.getExcessDisjoint(g, this.rep);
      var averageWeightDiff = this.averageWeightDiff(g, this.rep);
  
      var largeGenomeNormaliser = g.genes.length - 20;
      if (largeGenomeNormaliser < 1) {
        largeGenomeNormaliser = 1;
      }
  
      compatibility = (this.excessCoeff * excessAndDisjoint / largeGenomeNormaliser) + (this.weightDiffCoeff * averageWeightDiff);
      return (this.compatibilityThreshold > compatibility);
    }
  
    addToSpecies(p) {
      this.players.push(p);
    }
  
    getExcessDisjoint(brain1, brain2) {
      var matching = 0.0;
      for (var i = 0; i < brain1.genes.length; i++) {
        for (var j = 0; j < brain2.genes.length; j++) {
          if (brain1.genes[i].innovationNo == brain2.genes[j].innovationNo) {
            matching++;
            break;
          }
        }
      }
      return (brain1.genes.length + brain2.genes.length - 2 * matching);
    }
  
    averageWeightDiff(brain1, brain2) {
      if (brain1.genes.length == 0 || brain2.genes.length == 0) {
        return 0;
      }
  
      var matching = 0;
      var totalDiff = 0;
      for (var i = 0; i < brain1.genes.length; i++) {
        for (var j = 0; j < brain2.genes.length; j++) {
          if (brain1.genes[i].innovationNo == brain2.genes[j].innovationNo) {
            matching++;
            totalDiff += abs(brain1.genes[i].weight - brain2.genes[j].weight);
            break;
          }
        }
      }
      if (matching == 0) {
        return 100;
      }
      return totalDiff / matching;
    }
  
    sortSpecies() {
      var temp = [];
  
      for (var i = 0; i < this.players.length; i++) {
        var max = 0;
        var maxIndex = 0;
        for (var j = 0; j < this.players.length; j++) {
          if (this.players[j].fitness > max) {
            max = this.players[j].fitness;
            maxIndex = j;
          }
        }
        temp.push(this.players[maxIndex]);
        this.players.splice(maxIndex, 1);
        i--;
      }
  
      arrayCopy(temp, this.players);
      if (this.players.length == 0) {
        this.staleness = 200;
        return;
      }
      if (this.players[0].fitness > this.bestFitness) {
        this.staleness = 0;
        this.bestFitness = this.players[0].fitness;
        this.rep = this.players[0].brain.clone();
        this.champ = this.players[0].cloneForReplay();
      } else {
        this.staleness++;
      }
    }
  
    setAverage() {
      var sum = 0;
      for (var i = 0; i < this.players.length; i++) {
        sum += this.players[i].fitness;
      }
      this.averageFitness = sum / this.players.length;
    }
  
    giveMeBaby(innovationHistory) {
      var baby;
      if (random(1) < 0.25) {
        baby = this.selectPlayer().clone();
      } else {
        var parent1 = this.selectPlayer();
        var parent2 = this.selectPlayer();
  
        if (parent1.fitness < parent2.fitness) {
          baby = parent2.crossover(parent1);
        } else {
          baby = parent1.crossover(parent2);
        }
      }
      baby.brain.mutate(innovationHistory);
      return baby;
    }
  
    selectPlayer() {
      var fitnessSum = 0;
      for (var i = 0; i < this.players.length; i++) {
        fitnessSum += this.players[i].fitness;
      }
      var rand = random(fitnessSum);
      var runningSum = 0;
  
      for (var i = 0; i < this.players.length; i++) {
        runningSum += this.players[i].fitness;
        if (runningSum > rand) {
          return this.players[i];
        }
      }
      return this.players[0];
    }
  
    cull() {
      if (this.players.length > 2) {
        for (var i = this.players.length / 2; i < this.players.length; i++) {
          this.players.splice(i, 1);
          i--;
        }
      }
    }
  
    fitnessSharing() {
      for (var i = 0; i < this.players.length; i++) {
        this.players[i].fitness /= this.players.length;
      }
    }
  }
  