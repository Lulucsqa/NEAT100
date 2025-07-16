import NEAT from '../src/core/neat.js';
import { describe, it, before } from 'mocha';
import { expect } from 'chai';

describe('NEAT Algorithm', () => {
    let neat;
    
    before(() => {
        neat = new NEAT({
            populationSize: 10,
            inputNodes: 3,
            outputNodes: 2
        });
    });

    it('should initialize properly', () => {
        expect(neat.population.individuals).to.have.lengthOf(10);
        expect(neat.generation).to.equal(0);
    });

    it('should evolve without errors', () => {
        const bestGenome = neat.evolve();
        expect(neat.generation).to.equal(1);
        expect(bestGenome).to.have.property('fitness');
    });

    it('should maintain species diversity', () => {
        neat.evolve();
        expect(neat.population.species.length).to.be.greaterThan(0);
    });
});