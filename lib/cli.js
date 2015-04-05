var _ = require('lodash'),
  Articleify = require('./'),
  chalk = require('chalk'),
  fs = require('fs'),
  Handlebars = require('handlebars'),
  moment = require('moment'),
  path = require('path'),
  Promise = require('bluebird'),
  pretty = require('pretty-filename');

function Cli(opts) {
  _.extend(this, {
    extension: 'md',
    inquirer: require('inquirer')
  }, opts);
};

// build some markdown files.
Cli.prototype.build = function(yargs) {
  var argv = yargs.reset()
      .usage('$0 ./path-to-input-folder')
      .option('o', {
        alias: 'output-directory',
        description: 'where should HTML be outputted?',
        default: './articles'
      })
      .option('t', {
        alias: 'template-directory',
        description: 'templates directory to use when generating static site',
        default: path.resolve(__dirname, '../templates')
      })
      .help('h')
      .alias('h', 'help')
      .example('$0', 'build all markdown in current working directory')
      .argv,
    input = argv._[1] || './';

  (new Articleify({
    outputDirectory: argv.outputDirectory,
    input: input,
    templateDirectory: argv.templateDirectory
  })).build(function(err) {
    if (err) console.error(chalk.red(err.message));
    else console.log('html output in:', chalk.green(argv.outputDirectory));
  });
};

// generate a new article from a template.
Cli.prototype.generate = function(yargs) {
  var _this = this;

  var argv = yargs.reset()
    .usage('$0 ./path-to-output-directory')
    .option('o', {
      alias: 'output-directory',
      description: 'directory to write generated article stub to',
      default: './'
    })
    .help('h')
    .alias('h', 'help')
    .example('$0', 'generate the stub of an article in the current directory')
    .argv;

  this.inquirer.prompt([
    {name: 'headline', message: 'title for article'},
    {name: 'description', message: 'description of article'},
    {name: 'author', message: "author's fullname"},
    {name: 'twitter', message: "author's twitter username"},
    {name: 'github', message: "author's github username"},
    {name: 'datePublished', message: "date that this article was published", default: moment(new Date()).format("YYYY-MM-DD")}
  ], function(answers) {
    _this.inquirer.prompt([
      {name: 'filename', message: 'file to output article stub to', default: _this.filename(answers.headline)},
      {name: 'confirm', message: 'make it so?', type: 'confirm'}
    ], function(answers2) {
      answers = _.extend(answers, answers2);

      if (!answers.confirm) console.error(chalk.red('aborted'));
      else _this.generateArticle(argv, answers);
    });
  });
};

Cli.prototype.generateArticle = function(argv, answers) {
  var outputFile = path.resolve(argv.outputDirectory, './', answers.filename),
    template = Handlebars.compile(
      fs.readFileSync(path.resolve(__dirname, '../templates/article.hbs'), 'utf-8')
    );

  fs.writeFileSync(
    outputFile,
    template(answers),
    'utf-8'
  );

  console.log('generated: ' + chalk.green(outputFile));
};

Cli.prototype.filename = function(headline, cb) {
  return pretty(
    headline
    .split(' ')
    .join('-')
    .toLowerCase()
  ) + '.' + this.extension;
};

module.exports = Cli;
