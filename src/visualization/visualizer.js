export default class Visualizer {
    constructor(canvasId, width = 800, height = 600) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = width;
        this.canvas.height = height;
        this.nodeRadius = 15;
    }

    drawNetwork(nodes, connections) {
        this.clearCanvas();
        this.drawConnections(connections);
        this.drawNodes(nodes);
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawNodes(nodes) {
        nodes.forEach(node => {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, this.nodeRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = node.type === 'input' ? '#4CAF50' : 
                                node.type === 'output' ? '#F44336' : '#2196F3';
            this.ctx.fill();
            this.ctx.stroke();
        });
    }

    drawConnections(connections) {
        connections.forEach(conn => {
            if (conn.enabled) {
                this.ctx.beginPath();
                this.ctx.moveTo(conn.from.x, conn.from.y);
                this.ctx.lineTo(conn.to.x, conn.to.y);
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = conn.weight > 0 ? 'rgba(0,0,255,0.5)' : 'rgba(255,0,0,0.5)';
                this.ctx.stroke();
            }
        });
    }

    drawSpecies(speciesList) {
        const canvas = document.getElementById('speciesCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = 40;
        const maxHeight = canvas.height - 20;
        let x = 10;
        
        speciesList.forEach((species, i) => {
            const height = (species.members.length / maxSpeciesSize) * maxHeight;
            ctx.fillStyle = `hsl(${i * 30}, 70%, 50%)`;
            ctx.fillRect(x, canvas.height - height, barWidth, height);
            
            // Draw species info
            ctx.fillStyle = '#000';
            ctx.fillText(`S${i}`, x, canvas.height - 5);
            ctx.fillText(species.members.length, x, 15);
            
            x += barWidth + 10;
        });
    }
}