var _ = require('lodash'),
  Article = require('./article')
  fs = require('fs'),
  path = require('path'),
  Promise = require('bluebird');

function Articleify(opts) {
  _.extend(this, {
    input: './',
    outputDirectory: './articles'
  }, opts);
}

Articleify.prototype.build = function(cb) {
  var articles = [],
    _this = this;

  return this._markdownFiles()
    .then(function(files) {
      files = _.filter(files, function(f) {
        return /^.*\.(md|markdown)$/.test(f) && !/readme.md/i.test(f)
      });

      articles = _.map(files, function(f) {
        // pass the same options to article as
        // we construct articleify with.
        return new Article(_.extend({}, _this, {
          file: f
        }));
      }).reverse();

      return Promise.all(_.map(articles, function(a) {
        return a.load();
      }));
    })
    .then(function() {
      return Promise.all(_.map(articles, function(a) {
        return a.save(_this.outputDirectory);
      }));
    })
    .then(function() {
      if (articles.length) return articles[0].saveIndex(_this.outputDirectory);
    })
    .nodeify(cb);
};

Articleify.prototype._markdownFiles = function() {
  var _this = this;

  return new Promise(function(resolve, reject) {
    if (fs.lstatSync(_this.input).isDirectory()) {
      fs.readdir(_this.input, function(err, files) {
        if (err) reject(err);
        else resolve(_.map(files, function(f) {
          return path.resolve(_this.input, f);
        }))
      });
    } else resolve([_this.input]);
  })
  .catch(function(err) {
    throw Error('could not read ' + _this.input);
  });
};

module.exports = Articleify;
