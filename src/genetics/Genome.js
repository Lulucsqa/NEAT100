export default class Genome {
    constructor(config) {
        this.config = config;
        this.genes = [];
        this.nodes = [];
        this.fitness = 0;
        this.adjustedFitness = 0;
        this.globalRank = 0;
        
        this.initializeBasicNodes();
    }

    initializeBasicNodes() {
        // Create input nodes
        for (let i = 0; i < this.config.inputNodes; i++) {
            this.nodes.push({
                id: i,
                type: 'input'
            });
        }

        // Create output nodes
        for (let i = 0; i < this.config.outputNodes; i++) {
            this.nodes.push({
                id: this.config.inputNodes + i,
                type: 'output'
            });
        }
    }

    addConnectionMutation() {
        if (this.fullyConnected()) return;

        const [node1, node2] = this.getRandomNodes();
        const newConnection = {
            inNode: node1.id,
            outNode: node2.id,
            weight: Math.random() * 2 - 1, // -1 to 1
            enabled: true,
            innovation: this.getInnovationNumber(node1.id, node2.id)
        };

        this.genes.push(newConnection);
    }

    addNodeMutation() {
        if (this.genes.length === 0) return;

        const gene = this.selectRandomEnabledGene();
        gene.enabled = false;

        const newNodeId = this.nodes.length;
        this.nodes.push({
            id: newNodeId,
            type: 'hidden'
        });

        // Create new connections
        this.genes.push({
            inNode: gene.inNode,
            outNode: newNodeId,
            weight: 1,
            enabled: true,
            innovation: this.getInnovationNumber(gene.inNode, newNodeId)
        });

        this.genes.push({
            inNode: newNodeId,
            outNode: gene.outNode,
            weight: gene.weight,
            enabled: true,
            innovation: this.getInnovationNumber(newNodeId, gene.outNode)
        });
    }

    fullyConnected() {
        const possibleConnections = this.calculatePossibleConnections();
        return this.genes.length >= possibleConnections;
    }

    calculatePossibleConnections() {
        const inputCount = this.config.inputNodes;
        const outputCount = this.config.outputNodes;
        const hiddenCount = this.nodes.length - inputCount - outputCount;
        
        return (inputCount + hiddenCount) * (outputCount + hiddenCount);
    }

    // ... other methods ...
}
  