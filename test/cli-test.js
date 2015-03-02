var should = require('chai').should(),
  Cli = require('../lib/cli');

describe('Cli', function() {
  var cli = new Cli({

  });

  describe('filename', function() {
    it('generates a valid filename based on title', function(done) {
      cli.filename(
        "Ben's test article name", './'
      ).should.equal('bens-test-article-name.md');
      return done();
    });
  });
});
