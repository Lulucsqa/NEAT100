class Innovation {
    constructor(fromNode, toNode, innovationNumber) {
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.innovationNumber = innovationNumber;
    }

    matches(other) {
        return this.fromNode.number === other.fromNode.number && 
               this.toNode.number === other.toNode.number;
    }
}

class InnovationHistory {
    constructor() {
        this.innovations = [];
        this.innovationNumber = 0;
    }

    // Verifica se uma inovação já existe e retorna seu número
    contains(fromNode, toNode) {
        const searchInnovation = {
            fromNode: { number: fromNode.number },
            toNode: { number: toNode.number }
        };

        for (let innovation of this.innovations) {
            if (innovation.matches(searchInnovation)) {
                return innovation.innovationNumber;
            }
        }
        return -1;
    }

    // Adiciona uma nova inovação e retorna seu número
    createNewInnovation(fromNode, toNode) {
        const innovationNumber = this.innovationNumber;
        const innovation = new Innovation(fromNode, toNode, innovationNumber);
        this.innovations.push(innovation);
        this.innovationNumber++;
        return innovationNumber;
    }

    // Obtém ou cria um número de inovação
    getInnovationNumber(fromNode, toNode) {
        const existingInnovation = this.contains(fromNode, toNode);
        if (existingInnovation !== -1) {
            return existingInnovation;
        }
        return this.createNewInnovation(fromNode, toNode);
    }

    // Reseta o histórico de inovações
    reset() {
        this.innovations = [];
        this.innovationNumber = 0;
    }

    // Serializa o histórico para salvar
    serialize() {
        return {
            innovations: this.innovations.map(inn => ({
                fromNode: inn.fromNode.number,
                toNode: inn.toNode.number,
                innovationNumber: inn.innovationNumber
            })),
            innovationNumber: this.innovationNumber
        };
    }

    // Carrega o histórico salvo
    deserialize(data) {
        this.innovations = data.innovations.map(inn => 
            new Innovation(
                { number: inn.fromNode },
                { number: inn.toNode },
                inn.innovationNumber
            )
        );
        this.innovationNumber = data.innovationNumber;
    }
}
