var should = require('chai').should(),
  Article = require('../lib/article'),
  cheerio = require('cheerio');

describe('Article', function() {

  describe('load', function() {
    it('returns a parsed article with default meta information', function(done) {
      var article = new Article({
        file: './test/fixtures/article-1.md'
      }).load().then(function(article) {
        var $ = cheerio.load(article.articleBody);
        $('h1').text().should.equal("don't you hate pants?")
        return done();
      });
    });

    it('should wrap article in handlebars template', function(done) {
      var article = new Article({
        file: './test/fixtures/article-1.md'
      }).load().then(function(article) {
        var $ = cheerio.load(article.articleBody);
        $('div[itemprop="description"]').text().should.equal("");
        $('meta[itemprop="datePublished"]').attr('content').should.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/);
        return done();
      });
    });

    it('should parse meta information using html front-matter', function(done) {
      var article = new Article({
        file: './test/fixtures/article-2.markdown'
      }).load().then(function(article) {
        var $ = cheerio.load(article.articleBody);
        $('div[itemprop="headline"]').text().should.equal("What's the deal with JavaScript?!");
        $('span[itemprop="author"]').text().should.equal("bcoe");
        $('div[itemprop="description"]').text().should.match(/An article about life/);
        $('meta[itemprop="datePublished"]').attr('content').should.match(/2014-10-10/);
        return done();
      });
    });
  });

});
