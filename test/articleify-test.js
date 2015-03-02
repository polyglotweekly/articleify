var should = require('chai').should(),
  expect = require('chai').expect,
  Articleify = require('../lib'),
  recursive = require('recursive-readdir'),
  rimraf = require('rimraf');

describe('Articleify', function() {

  afterEach(function() {
    rimraf.sync('./articles');
  });

  describe('build', function() {
    it('generates html from markdown when path to file is given', function(done) {
      var a = new Articleify({
        input: './test/fixtures/article-2.markdown'
      });

      a.build(function(err) {
        fs.existsSync('./articles/2014/10/10/article-2.html').should.equal(true);
        return done();
      });
    });

    it('converts all markdown files to html if directory is given', function(done) {
      var a = new Articleify({
        input: './test/fixtures'
      });

      a.build(function(err) {
        recursive('./articles', function(err, files) {
          files.length.should.equal(2);
          return done();
        });
      });
    });

    it('returns an error if input file does not exist', function(done) {
      var a = new Articleify({
        input: './test/fixtures/missing.md'
      });

      a.build(function(err) {
        err.message.should.equal('could not read ./test/fixtures/missing.md');
        return done();
      });
    });
  });

});
