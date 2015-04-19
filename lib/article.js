var _ = require('lodash'),
  cheerio = require('cheerio'),
  fs = require('fs'),
  Handlebars = require('handlebars'),
  marky = require('marky-markdown'),
  mkdirp = require('mkdirp'),
  moment = require('moment'),
  path = require('path'),
  Promise = require('bluebird'),
  recursive = require('recursive-readdir'),
  RSS = require('rss'),
  url = require('url');

function Article(opts) {
  _.extend(this, {
    file: null, // path the file to parse article from.
    templateDirectory: path.resolve(__dirname, '../templates'),
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
      return _this._readFile(path.resolve(_this.templateDirectory, './wrap.hbs'));
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
    datePublished = $('meta[name=datePublished]').attr('content'),
    github = $('meta[name=github]').attr('content'),
    twitter = $('meta[name=twitter]').attr('twitter');

  if (headline) meta.headline = headline;
  if (description) meta.description = description;
  if (author) meta.author = author;
  if (github) meta.github = github;
  if (twitter) meta.twitter = twitter;
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

Article.prototype.saveIndex = function(outputPath) {
  var _this = this,
    articles = null;

  return new Promise(function(resolve, reject) {
    recursive(outputPath, function(err, files) {
      if (err) reject(err);
      else resolve(_.reject(files, function(a) {
        return a.indexOf('/index.html') > -1 || !/\.html$/.test(a)
      }));
    });
  })
  .then(function(files) {
    // load the HTML-frontmatter meta-info
    // from each of the articles.
    articles = _.map(files, function(file) {
      return _this._loadMeta(outputPath, file);
    })

    articles.sort(function(a, b) {
      return (b.date || '').localeCompare(a.date || '');
    });

    return _this._readFile(path.resolve(_this.templateDirectory, './index.hbs'));
  })
  // generate the index.html file.
  .then(function(content) {
    var template = _this.Handlebars.compile(content);

    return _this._writeFile(
      path.resolve(outputPath, './index.html'),
      template({
        articles: articles
      })
    );
  })
  // generate the RSS feed.
  .then(function(content) {
    var p = require(
        path.resolve(process.cwd(), './package')
      ),
      feed = new RSS({
        title: p.name,
        description: p.description,
        feed_url: url.resolve(p.homepage, '/feed.xml'),
        site_url: p.homepage,
        managingEditor: p.author
      });

    articles.forEach(function(a) {
      feed.item({
        title: a.headline,
        description: a.description,
        url: url.resolve(p.homepage, a.path),
        author: a.author,
        date: new Date(a.date)
      })
    });

    return _this._writeFile(
      path.resolve(outputPath, './feed.xml'),
      feed.xml({indent: true})
    );
  })
};

Article.prototype._loadMeta = function(outputPath, file) {
  var $ = cheerio.load(fs.readFileSync(file, 'utf-8'));
  return {
    path: path.relative(outputPath, file),
    headline: $('meta[name=headline]').attr('content'),
    description: $('meta[name=description]').attr('content'),
    author: $('meta[name=author]').attr('content'),
    github: $('meta[name=github]').attr('content'),
    twitter: $('meta[name=twitter]').attr('content'),
    date: $('meta[name=datePublished]').attr('content')
  }
};

module.exports = Article;
