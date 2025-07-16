class ConnectionHistory {
    constructor(from, to, inno, innovationNos) {
      this.fromNode = from;
      this.toNode = to;
      this.innovationNumber = inno;
      this.innovationNumbers = [];
      arrayCopy(innovationNos, this.innovationNumbers);
    }
  
    matches(genome, from, to) {
      if (genome.genes.length === this.innovationNumbers.length) {
        if (from.number === this.fromNode && to.number === this.toNode) {
          for (var i = 0; i < genome.genes.length; i++) {
            if (!this.innovationNumbers.includes(genome.genes[i].innovationNo)) {
              return false;
            }
          }
          return true;
        }
      }
      return false;
    }
  }
  