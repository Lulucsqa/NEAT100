class Node {
    constructor(no) {
      this.number = no;
      this.inputSum = 0;
      this.outputValue = 0;
      this.outputConnections = [];
      this.layer = 0;
      this.drawPos = createVector();
    }
  
    engage() {
      if(this.layer != 0) {
        this.outputValue = this.sigmoid(this.inputSum);
      }
      for(var i = 0; i < this.outputConnections.length; i++) {
        if(this.outputConnections[i].enabled) {
          this.outputConnections[i].toNode.inputSum += this.outputConnections[i].weight * this.outputValue;
        }
      }
    }
  
    sigmoid(x) {
      return 1.0 / (1.0 + pow(Math.E, -4.9 * x));
    }
  
    isConnectedTo(node) {
      if(node.layer == this.layer) return false;
  
      if(node.layer < this.layer) {
        for(var i = 0; i < node.outputConnections.length; i++) {
          if(node.outputConnections[i].toNode == this) {
            return true;
          }
        }
      } else {
        for(var i = 0; i < this.outputConnections.length; i++) {
          if(this.outputConnections[i].toNode == node) {
            return true;
          }
        }
      }
      return false;
    }
  
    clone() {
      var clone = new Node(this.number);
      clone.layer = this.layer;
      return clone;
    }
  }
  