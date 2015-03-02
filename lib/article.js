var _ = require('lodash'),
  fs = require('fs'),
  Handlebars = require('handlebars'),
  marky = require('marky-markdown'),
  mkdirp = require('mkdirp'),
  moment = require('moment'),
  path = require('path'),
  Promise = require('bluebird');

function Article(opts) {
  _.extend(this, {
    file: null, // path the file to parse article from.
    templateFile: path.resolve(__dirname, '../templates/wrap.hbs'),
    Handlebars: null,
    meta: {
      headline: '',
      description: '',
      author: '',
      datePublished: moment(new Date()).format("YYYY-MM-DD")
    },
    articleBody: null
  }, opts);

  // you can opt to pass in your own handlebars
  // instance, this can be useful for generating your
  // own content wrapper.
  if (!this.Handlebars) this.Handlebars = Handlebars;
}

Article.prototype.load = function(cb) {
  var _this = this,
    content = null,
    template = null;

  return this._readFile(this.file)
    .then(function(_content) {
      content = _content;
      return _this._readFile(_this.templateFile);
    })
    .then(function(_content) {
      template = _this.Handlebars.compile(_content);
    })
    .then(function() {
      return _this._createBody(template, content);
    }).nodeify(cb);
};

Article.prototype._readFile = function(file) {
  return new Promise(function(resolve, reject) {
    fs.readFile(file, 'utf-8', function(err, content) {
      if (err) reject(err);
      else resolve(content);
    });
  });
};

Article.prototype._createBody = function(template, content) {
  var $ = marky(content, {sanitize: false}),
    data = _.extend(this.meta, this._extractMeta($));

  data.articleBody = $.html();
  data.datePublished = moment(data.datePublished).utc().format("YYYY-MM-DD");
  this.articleBody = template(data);

  return this;
};

Article.prototype._extractMeta = function($) {
  var meta = {},
    headline = $('meta[name=headline]').attr('content'),
    description = $('meta[name=description]').attr('content'),
    author = $('meta[name=author]').attr('content'),
    datePublished = $('meta[name=datePublished]').attr('content');

  if (headline) meta.headline = headline;
  if (description) meta.description = description;
  if (author) meta.author = author;
  if (datePublished) meta.datePublished = new Date(datePublished);

  return meta;
};

Article.prototype.save = function(outputPath, cb) {
  var _this = this,
      outputPath = path.resolve(
      outputPath,
      './',
      moment(this.meta.datePublished).format("YYYY/MM/DD")
    ),
    file = path.basename(this.file, path.extname(this.file)) + '.html';

  return this._mkdirp(outputPath)
    .then(function() {
      return _this._writeFile(
        path.resolve(outputPath, './', file),
        _this.articleBody
      );
    })
    .nodeify(cb);
};

Article.prototype._mkdirp = function(outputPath) {
  return new Promise(function(resolve, reject) {
    mkdirp(outputPath, function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

Article.prototype._writeFile = function(file, content) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(file, content, 'utf-8', function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
};

module.exports = Article;
