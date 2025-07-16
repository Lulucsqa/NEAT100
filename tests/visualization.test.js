function testVisualization() {
    const neat = new NEAT({
        populationSize: 50,
        visualization: true
    });
    
    // Run 10 generations and verify visualization updates
    for (let i = 0; i < 10; i++) {
        neat.evolve();
        console.log(`Generation ${i} - Species: ${neat.population.species.length}`);
        
        // Verify canvas is updating
        const canvas = document.getElementById('networkCanvas');
        const imageData = canvas.getContext('2d').getImageData(0, 0, 1, 1).data;
        expect(imageData.some(channel => channel !== 0)).to.be.true;
    }
}