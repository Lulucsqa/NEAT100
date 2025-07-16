class Visualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas com ID '${canvasId}' não encontrado`);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.nodeRadius = 10;
        this.layerSpacing = 100;
        this.nodeSpacing = 50;
        this.animationFrame = null;
    }

    // Inicia a visualização em tempo real
    startVisualization(genome, fps = 30) {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        const draw = () => {
            this.drawNetwork(genome);
            this.animationFrame = setTimeout(() => {
                requestAnimationFrame(draw);
            }, 1000 / fps);
        };

        draw();
    }

    // Para a visualização
    stopVisualization() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            clearTimeout(this.animationFrame);
            this.animationFrame = null;
        }
    }

    // Desenha a rede neural
    drawNetwork(genome) {
        if (!this.ctx || !genome) return;

        // Limpa o canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Organiza os nós por camadas
        const layers = this.organizeLayers(genome);
        
        // Calcula as posições dos nós
        const nodePositions = this.calculateNodePositions(layers);
        
        // Desenha as conexões primeiro
        this.drawConnections(genome, nodePositions);
        
        // Depois desenha os nós
        this.drawNodes(layers, nodePositions);
    }

    // Organiza os nós em camadas
    organizeLayers(genome) {
        const layers = Array.from({ length: genome.layers + 1 }, () => []);
        
        for (let node of genome.nodes) {
            if (node.layer >= 0 && node.layer <= genome.layers) {
                layers[node.layer].push(node);
            }
        }
        
        return layers;
    }

    // Calcula as posições de todos os nós
    calculateNodePositions(layers) {
        const positions = new Map();
        const marginX = 50;
        const availableWidth = this.canvas.width - (2 * marginX);
        
        layers.forEach((layer, layerIndex) => {
            const x = marginX + (availableWidth * layerIndex / (layers.length - 1));
            
            layer.forEach((node, nodeIndex) => {
                const y = (this.canvas.height / (layer.length + 1)) * (nodeIndex + 1);
                positions.set(node.number, { x, y });
            });
        });
        
        return positions;
    }

    // Desenha as conexões entre os nós
    drawConnections(genome, positions) {
        this.ctx.lineWidth = 1;
        
        for (let gene of genome.genes) {
            if (!gene.enabled) continue;

            const fromPos = positions.get(gene.fromNode.number);
            const toPos = positions.get(gene.toNode.number);
            
            if (!fromPos || !toPos) continue;

            // Define a cor e espessura baseada no peso
            const weight = gene.weight;
            const absWeight = Math.abs(weight);
            const alpha = Math.min(Math.max(absWeight, 0.2), 1);
            const color = weight > 0 ? `rgba(0,255,0,${alpha})` : `rgba(255,0,0,${alpha})`;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = Math.max(absWeight * 3, 1);
            
            // Desenha a conexão
            this.ctx.beginPath();
            this.ctx.moveTo(fromPos.x, fromPos.y);
            this.ctx.lineTo(toPos.x, toPos.y);
            this.ctx.stroke();
        }
    }

    // Desenha os nós
    drawNodes(layers, positions) {
        layers.forEach((layer, layerIndex) => {
            layer.forEach(node => {
                const pos = positions.get(node.number);
                if (!pos) return;
                
                // Desenha o círculo do nó
                this.ctx.beginPath();
                this.ctx.fillStyle = this.getNodeColor(node, layerIndex, layers.length);
                this.ctx.arc(pos.x, pos.y, this.nodeRadius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Desenha a borda
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
                
                // Adiciona o número do nó
                this.ctx.fillStyle = 'black';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(node.number, pos.x, pos.y);
            });
        });
    }

    // Define a cor do nó baseado em seu tipo
    getNodeColor(node, layerIndex, totalLayers) {
        if (layerIndex === 0) return '#90EE90'; // Input nodes (light green)
        if (layerIndex === totalLayers - 1) return '#ADD8E6'; // Output nodes (light blue)
        return '#FFFFE0'; // Hidden nodes (light yellow)
    }

    // Redimensiona o canvas
    resize(width, height) {
        if (!this.canvas) return;
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
    }
}
