const assert = require('assert');

describe('NEAT Basic Tests', function() {
  it('should load all required classes', function() {
    assert.ok(typeof Genome !== 'undefined', 'Genome class not loaded');
    assert.ok(typeof Population !== 'undefined', 'Population class not loaded');
  });
});