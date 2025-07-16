class ConnectionGene {
    constructor(from, to, w, inno) {
      this.fromNode = from;
      this.toNode = to;
      this.weight = w;
      this.enabled = true;
      this.innovationNo = inno;
    }
  
    mutateWeight() {
      var rand2 = random(1);
      if (rand2 < 0.1) {
        this.weight = random(-1, 1);
      } else {
        this.weight += (randomGaussian() / 50);
        this.weight = constrain(this.weight, -1, 1);
      }
    }
  
    clone(from, to) {
      var clone = new ConnectionGene(from, to, this.weight, this.innovationNo);
      clone.enabled = this.enabled;
      return clone;
    }
  }
  