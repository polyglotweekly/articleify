#!/usr/bin/env node

var yargs = require('yargs')
    .usage('Usage: $0 <command> options')
    .alias('h', 'help')
    .command('generate', 'generate a new markdown article from a template')
    .command('build', 'convert a directory full of markdown files into HTML')
    .example('$0 build ./markdown', 'convert markdown files in ./markdown into HTML files in ./articles')
    .example('$0 <command> --help', 'get help for a specific command')
  argv = yargs.argv,
  chalk = require('chalk'),
  Cli = require('../lib/cli'),
  cli = new Cli(),
  command = argv._[0];

if (command && cli[command]) {
  cli[command](yargs);
} else {
  yargs.showHelp();
  if (command && !argv.help) console.error(chalk.red('unrecognized command'));
}

process.on('uncaughtException', function(err) {
  console.error(chalk.red(err.message));
});
