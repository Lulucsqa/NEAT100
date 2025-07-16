// Box2D.js - Versão simplificada para o projeto NEAT
class Box2D {
    constructor() {
        this.gravity = { x: 0, y: 9.8 };
        this.scale = 30; // pixels por metro
    }
    
    createWorld() {
        return {
            gravity: this.gravity,
            bodies: []
        };
    }
    
    createBody(world, options) {
        const body = {
            position: options.position || { x: 0, y: 0 },
            velocity: options.velocity || { x: 0, y: 0 },
            type: options.type || 'dynamic'
        };
        world.bodies.push(body);
        return body;
    }
    
    step(world, timeStep) {
        // Simulação física simplificada
        world.bodies.forEach(body => {
            if (body.type === 'dynamic') {
                body.velocity.y += world.gravity.y * timeStep;
                body.position.x += body.velocity.x * timeStep;
                body.position.y += body.velocity.y * timeStep;
            }
        });
    }
}

// Exporta para uso global
if (typeof window !== 'undefined') {
    window.Box2D = Box2D;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Box2D;
}
